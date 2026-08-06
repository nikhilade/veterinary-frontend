import type { ApiResponse } from "./api/types";
import { handleMockRequest } from "./mock/handlers";

/**
 * Typed API client. Every component talks to the backend through this module.
 *
 * When VITE_API_BASE_URL is set, requests go over HTTP to the real backend.
 * Otherwise they are served by the local mock layer (src/lib/mock).
 */

const BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";
export const USING_MOCKS = BASE_URL === "";

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
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, query, headers } = options;
  const search = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined) search.set(k, String(v));
  });

  let payload: ApiResponse<T>;

  if (USING_MOCKS) {
    payload = (await handleMockRequest(path, method, body ?? {}, search)) as ApiResponse<T>;
  } else {
    const token = readToken();
    const url = `${BASE_URL}${path}${search.toString() ? `?${search}` : ""}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    payload = (await res.json()) as ApiResponse<T>;
  }

  if (!payload.success) {
    throw new ApiError(
      payload.error?.code ?? "UNKNOWN_ERROR",
      payload.error?.message ?? "Something went wrong.",
      payload.error?.data ?? {},
    );
  }
  return payload;
}

export const apiClient = {
  request,
  async get<T>(path: string, query?: RequestOptions["query"]) {
    return (await request<T>(path, { method: "GET", query })).data;
  },
  async post<T>(path: string, body?: Record<string, unknown>, headers?: Record<string, string>) {
    return (await request<T>(path, { method: "POST", body, headers })).data;
  },
  async patch<T>(path: string, body?: Record<string, unknown>, headers?: Record<string, string>) {
    return (await request<T>(path, { method: "PATCH", body, headers })).data;
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
