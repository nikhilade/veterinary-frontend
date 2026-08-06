import { useSyncExternalStore } from "react";
import { apiClient } from "../api-client";
import { endpoints } from "../api/endpoints";
import type { AuthUser, LoginResponse, Role } from "../api/types";

const STORAGE_KEY = "petgood.auth";

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
}

let state: AuthState = { token: null, user: null, hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  emit();
}

function persist() {
  if (typeof window === "undefined") return;
  if (state.token && state.user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function hydrateAuth() {
  if (typeof window === "undefined" || state.hydrated) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
      state = { token: parsed.token, user: parsed.user, hydrated: true };
    } else {
      state = { ...state, hydrated: true };
    }
  } catch {
    state = { ...state, hydrated: true };
  }
  emit();
}

const serverSnapshot: AuthState = { token: null, user: null, hydrated: false };

export function useAuth() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => serverSnapshot,
  );

  return {
    ...snapshot,
    role: snapshot.user?.role ?? null,
    isAuthenticated: Boolean(snapshot.token),
  };
}

export const authStore = {
  get: () => state,
  async login(email: string, password: string, role?: Role) {
    const data = await apiClient.post<LoginResponse>(endpoints.auth.login, { email, password, role });
    setState({ token: data.token, user: data.user, hydrated: true });
    persist();
    return data.user;
  },
  async signup(input: { name: string; email: string; password: string; role?: Role }) {
    const data = await apiClient.post<LoginResponse>(endpoints.auth.signup, { ...input });
    setState({ token: data.token, user: data.user, hydrated: true });
    persist();
    return data.user;
  },
  logout() {
    setState({ token: null, user: null, hydrated: true });
    persist();
  },
};
