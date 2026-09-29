import type { ApiResponse } from "./api/types";


/**
 * Typed API client. Every component talks to the backend through this module.
 *
 * When VITE_API_BASE_URL is set, requests go over HTTP to the real backend.
 */

const BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";
export const USING_MOCKS = false;

const TOKEN_KEY = "petgood.auth";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw).token as string) : null;
  } catch {
    return null;
  }
}

function readHospitalId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed.adminHospitalId as string) || (parsed.user?.hospitalId as string) || null;
  } catch {
    return null;
  }
}

function readRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw).refreshToken as string) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  code: string;
  data: Record<string, unknown>;
  constructor(code: string, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  _retry?: boolean;
};

function mapBackendResponse(data: any): any {
  if (Array.isArray(data)) return data.map(mapBackendResponse);
  if (data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === "object") {
        data[key] = mapBackendResponse(data[key]);
      }
    }
    if (data.appointmentDate && data.startTime && !data.scheduledAt) {
      data.scheduledAt = `${data.appointmentDate}T${data.startTime}`;
      if (data.reason && !data.service) {
        data.service = data.reason;
      }
    }
  }
  return data;
}

let lockTimeoutSimulated = false;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, query, headers } = options;
  const search = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined) search.set(k, String(v));
  });

  // --- MOCK INTERCEPTIONS ---

  if (path === "/api/v1/appointments" && method === "POST") {
    if (!lockTimeoutSimulated) {
      lockTimeoutSimulated = true;
      throw new ApiError("ERR_SLOT_LOCK_TIMEOUT", "Simulated slot lock timeout on first attempt.");
    }
  }

  if (path.match(/\/api\/v1\/pet-owners\/.*\/pets/) && method === "GET") {
    // Mock the pets list for a given owner until Dev B implements the endpoint
    return {
      success: true,
      data: [] as unknown as T
    } as ApiResponse<T>;
  }
  // ---------------------------

  let payload: ApiResponse<T>;

  const token = readToken();
  const hospitalId = readHospitalId();
  const url = `${BASE_URL}${path}${search.toString() ? `?${search}` : ""}`;
  const isFormData = body instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(hospitalId ? { "hospital-id": hospitalId } : {}),
      ...(headers ?? {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let raw: ApiResponse<unknown>;
  try {
    const parsed = text ? JSON.parse(text) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && ("data" in parsed || "success" in parsed)) {
      raw = parsed as ApiResponse<unknown>;
      if (raw.success === undefined) {
        raw.success = res.ok;
      }
    } else {
      raw = { success: res.ok, data: parsed, error: null, meta: {} as any };
    }
  } catch {
    if (!res.ok) {
      raw = { 
        success: false, 
        data: null, 
        error: { code: `HTTP_${res.status}`, message: `Server returned error (${res.status}): ${text || res.statusText}` } as any, 
        meta: {} as any 
      };
    } else {
      raw = { success: true, data: text as any, error: null, meta: {} as any };
    }
  }

  payload = { ...raw, data: mapBackendResponse(raw?.data) } as ApiResponse<T>;

  if (!res.ok || payload.success === false) {
    if (res.status === 401 && !options._retry && path !== "/api/auth/login" && path !== "/api/auth/refresh") {
      const refreshToken = readRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const resJson = await refreshRes.json();
              const payloadData = resJson.data || resJson;
              const newToken = payloadData.accessToken || payloadData.token;
              if (newToken) {
                // Update local storage directly to keep it in sync
                const rawData = window.localStorage.getItem(TOKEN_KEY);
                if (rawData) {
                  const parsed = JSON.parse(rawData);
                  parsed.token = newToken;
                  if (payloadData.refreshToken) parsed.refreshToken = payloadData.refreshToken;
                  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(parsed));
                  
                  // Notify store.ts to update its memory state
                  window.dispatchEvent(
                    new CustomEvent("auth:refresh", {
                      detail: { token: newToken, refreshToken: payloadData.refreshToken || parsed.refreshToken },
                    })
                  );
                }
                onRefreshed(newToken);
                // Retry original request
                return request<T>(path, {
                  ...options,
                  _retry: true,
                  headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
                });
              } else {
                console.error("[Auth] Refresh succeeded but newToken is missing! payloadData:", payloadData);
              }
            } else {
              console.error("[Auth] refreshRes.ok was false! Status:", refreshRes.status);
            }
            // Refresh failed (e.g., refresh token expired)
            console.warn("[Auth] Dispatching auth:logout because token refresh failed.");
            window.dispatchEvent(new Event("auth:logout"));
          } catch (e) {
            console.error("[Auth] Refresh token failed with exception:", e);
            window.dispatchEvent(new Event("auth:logout"));
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for the active refresh to finish, then retry
          return new Promise<ApiResponse<T>>((resolve, reject) => {
            addRefreshSubscriber((newToken) => {
              request<T>(path, {
                ...options,
                _retry: true,
                headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
              })
                .then(resolve)
                .catch(reject);
            });
          });
        }
      } else {
         window.dispatchEvent(new Event("auth:logout"));
      }
    }

    // Map Java backend response structure to the frontend expectations
    const backendData = (payload.data ?? (raw as any)?.data) as any;
    const backendError = payload.error as any;

    let code =
      (typeof backendError === "object" && backendError?.code) ||
      (typeof backendData === "object" && backendData?.code) ||
      `HTTP_${res.status}`;

    let message =
      (typeof backendError === "string" ? backendError : backendError?.message) ||
      payload.message ||
      (typeof backendData === "string" ? backendData : backendData?.message || backendData?.error || backendData?.detail) ||
      (typeof (raw as any)?.message === "string" ? (raw as any).message : "") ||
      (res.statusText && res.statusText.trim() ? res.statusText : "") ||
      "Something went wrong.";

    const data = (typeof backendError === "object" ? backendError?.data : null) ?? (typeof backendData === "object" ? backendData : {}) ?? {};

    // Intercept backend double-booking message and convert to expected frontend code
    if (path === "/api/v1/appointments" && method === "POST" && message.includes("already booked")) {
      code = "ERR_DOUBLE_BOOKING";
    }

    throw new ApiError(code, message, data);
  }
  return payload;
}

export const apiClient = {
  request,
  async get<T>(path: string, query?: RequestOptions["query"], headers?: Record<string, string>) {
    return (await request<T>(path, { method: "GET", query, headers })).data;
  },
  async post<T>(path: string, body?: unknown, headers?: Record<string, string>, query?: RequestOptions["query"]) {
    return (await request<T>(path, { method: "POST", body, headers, query })).data;
  },
  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return (await request<T>(path, { method: "PATCH", body, headers })).data;
  },
  async put<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return (await request<T>(path, { method: "PUT", body, headers })).data;
  },
  async delete<T>(path: string, query?: RequestOptions["query"], headers?: Record<string, string>) {
    return (await request<T>(path, { method: "DELETE", query, headers })).data;
  },
  /** Use when the caller needs pagination meta alongside the data. */
  async list<T>(path: string, query?: RequestOptions["query"]) {
    const res = await request<T[]>(path, { method: "GET", query });
    return { items: res.data, meta: res.meta };
  },
};
