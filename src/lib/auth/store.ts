import { useSyncExternalStore } from "react";
import { apiClient, ApiError } from "../api-client";
import { endpoints } from "../api/endpoints";
import type { AuthUser, Role } from "../api/types";

const STORAGE_KEY = "petgood.auth";

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  adminHospitalId: string | null;
  hydrated: boolean;
}

let state: AuthState = { token: null, refreshToken: null, user: null, adminHospitalId: null, hydrated: false };
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
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: state.token, refreshToken: state.refreshToken, user: state.user, adminHospitalId: state.adminHospitalId })
    );
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

async function verifyTokenWithBackend() {
  if (!state.token) return;
  if (state.token === "mock-token") {
    authStore.logout();
    return;
  }
  try {
    const me = await apiClient.get<any>(endpoints.auth.me);
    if (me) {
      const primaryRole = (me.roles?.[0] as Role) || state.user?.role || "SUPER_ADMIN";
      const fullName = [me.firstName, me.lastName].filter(Boolean).join(" ");
      const updatedUser: AuthUser = {
        id: me.id || state.user?.id || "",
        name: fullName || me.email || state.user?.name || "User",
        email: me.email || state.user?.email || "",
        role: primaryRole,
        avatarUrl: null,
        hospitalId: me.hospitalId || state.user?.hospitalId,
      };
      setState({ user: updatedUser });
      persist();
    }
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("[Auth] verifyTokenWithBackend failed! Logging out. Error:", err);
      authStore.logout();
    }
  }
}

export function hydrateAuth() {
  if (typeof window === "undefined" || state.hydrated) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token: string; refreshToken?: string; user: AuthUser; adminHospitalId?: string };
      state = { token: parsed.token, refreshToken: parsed.refreshToken ?? null, user: parsed.user, adminHospitalId: parsed.adminHospitalId ?? null, hydrated: true };
      if (parsed.token === "mock-token") {
        authStore.logout();
      } else {
        verifyTokenWithBackend();
      }
    } else {
      state = { ...state, hydrated: true };
    }
  } catch {
    state = { ...state, hydrated: true };
  }
  emit();
}

const serverSnapshot: AuthState = { token: null, refreshToken: null, user: null, adminHospitalId: null, hydrated: false };

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
    hospitalId: snapshot.user?.hospitalId ?? null,
    adminHospitalId: snapshot.adminHospitalId ?? null,
    isAuthenticated: Boolean(snapshot.token),
  };
}

export const authStore = {
  get: () => state,
  setAdminHospital: (id: string | null) => {
    setState({ adminHospitalId: id });
    persist();
  },
  async login(email: string, password: string, role?: Role) {
    const res = await apiClient.post<any>(endpoints.auth.login, { email, password });
    if (res && (res.accessToken || res.token)) {
      const token = res.accessToken || res.token;
      const refreshToken = res.refreshToken || null;
      const backendUser = res.user;
      const primaryRole = (backendUser?.roles?.[0] as Role) || role || "SUPER_ADMIN";
      const fullName = [backendUser?.firstName, backendUser?.lastName].filter(Boolean).join(" ");
      const user: AuthUser = {
        id: backendUser?.id || "00000000-0000-0000-0000-000000000001",
        name: fullName || backendUser?.email || email,
        email: backendUser?.email || email,
        role: primaryRole,
        avatarUrl: null,
        hospitalId: backendUser?.hospitalId,
      };
      setState({ token, refreshToken, user, adminHospitalId: null, hydrated: true });
      persist();
      return user;
    }
    throw new ApiError("ERR_INVALID_CREDENTIALS", "Invalid email or password.");
  },
  async signup(input: { name: string; email: string; password: string; role?: Role }) {
    try {
      const res = await apiClient.post<any>(endpoints.auth.signup, input);
      if (res && (res.accessToken || res.token)) {
        const token = res.accessToken || res.token;
        const refreshToken = res.refreshToken || null;
        const backendUser = res.user;
        const primaryRole = (backendUser?.roles?.[0] as Role) || input.role || "PET_OWNER";
        const fullName = [backendUser?.firstName, backendUser?.lastName].filter(Boolean).join(" ");
        const user: AuthUser = {
          id: backendUser?.id || "00000000-0000-0000-0000-000000000001",
          name: fullName || input.name,
          email: backendUser?.email || input.email,
          role: primaryRole,
          avatarUrl: null,
          hospitalId: backendUser?.hospitalId,
        };
        setState({ token, refreshToken, user, adminHospitalId: null, hydrated: true });
        persist();
        return user;
      }
    } catch (e) {
      if (e instanceof ApiError && !e.code.includes("404")) {
        throw e;
      }
    }

    const user: AuthUser = {
      id: "00000000-0000-0000-0000-000000000001",
      name: input.name,
      email: input.email,
      role: input.role || "PET_OWNER",
      avatarUrl: null,
    };
    setState({ token: "mock-token", refreshToken: null, user, adminHospitalId: null, hydrated: true });
    persist();
    return user;
  },
  async logout() {
    if (state.refreshToken) {
      try {
        await apiClient.post(endpoints.auth.logout, { refreshToken: state.refreshToken });
      } catch {
        // Ignore logout request errors
      }
    }
    setState({ token: null, refreshToken: null, user: null, adminHospitalId: null, hydrated: true });
    persist();
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("auth:logout", () => {
    authStore.logout();
  });
  window.addEventListener("auth:refresh", (e: any) => {
    setState({
      token: e.detail.token,
      refreshToken: e.detail.refreshToken || state.refreshToken,
    });
    persist();
  });
}
