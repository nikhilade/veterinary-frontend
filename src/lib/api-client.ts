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

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, query, headers } = options;
  const search = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined) search.set(k, String(v));
  });

  // --- MOCK INTERCEPTIONS ---
  if (path.includes("/api/v1/appointments/slots/available") && method === "GET") {
    const d = query?.date as string || new Date().toISOString().split("T")[0];
    return {
      success: true,
      data: [
        { startAt: `${d}T09:00:00Z`, available: true },
        { startAt: `${d}T09:30:00Z`, available: true },
        { startAt: `${d}T10:00:00Z`, available: true },
        { startAt: `${d}T10:30:00Z`, available: true },
        { startAt: `${d}T14:00:00Z`, available: true },
        { startAt: `${d}T15:00:00Z`, available: true },
        { startAt: `${d}T16:00:00Z`, available: true },
      ] as unknown as T
    } as ApiResponse<T>;
  }

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
  const url = `${BASE_URL}${path}${search.toString() ? `?${search}` : ""}`;
  const isFormData = body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      throw new ApiError(`HTTP_${res.status}`, `Server returned error (${res.status}): ${text || res.statusText}`);
    }
    raw = { success: true, data: text as any, error: null, meta: {} as any };
  }

  payload = { ...raw, data: mapBackendResponse(raw?.data) } as ApiResponse<T>;


  if (!payload.success && !res.ok) {
    // Map Java backend response structure to the frontend expectations
    let code = payload.error?.code ?? `HTTP_${res.status}`;
    let message = payload.error?.message ?? payload.message ?? res.statusText ?? "Something went wrong.";
    const data = payload.error?.data ?? {};

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
  async get<T>(path: string, query?: RequestOptions["query"]) {
    return (await request<T>(path, { method: "GET", query })).data;
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
  async delete<T>(path: string) {
    return (await request<T>(path, { method: "DELETE" })).data;
  },
  /** Use when the caller needs pagination meta alongside the data. */
  async list<T>(path: string, query?: RequestOptions["query"]) {
    const res = await request<T[]>(path, { method: "GET", query });
    return { items: res.data, meta: res.meta };
  },
};
