import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export enum UserRole {
  user = "user",
  reviewer = "reviewer",
  admin = "admin",
}

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
};

type SignupPayload = {
  email: string;
  username: string;
  password: string;
  display_name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  clearError: () => void;
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
  hasRole: (roles: UserRole[]) => boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1";
const ACCESS_TOKEN_KEY = "aftermath.accessToken";
const REFRESH_TOKEN_KEY = "aftermath.refreshToken";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const persistAuth = useCallback((response: AuthResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    setAccessToken(response.access_token);
    setRefreshToken(response.refresh_token);
    setUser(response.user);
    scheduleRefresh(response.access_token, response.expires_in);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const request = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    return response.json() as Promise<T>;
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? refreshToken;
    if (!currentRefreshToken) {
      clearAuth();
      return null;
    }

    try {
      const response = await request<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
      persistAuth(response);
      return response.access_token;
    } catch (refreshError) {
      clearAuth();
      setError(refreshError instanceof Error ? refreshError.message : "Session refresh failed");
      return null;
    }
  }, [clearAuth, persistAuth, refreshToken, request]);

  function scheduleRefresh(token: string, fallbackExpiresIn: number) {
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
    }
    const payload = decodeJwtPayload(token);
    const expiresAt = typeof payload?.exp === "number" ? payload.exp * 1000 : Date.now() + fallbackExpiresIn * 1000;
    const delay = Math.max(15_000, expiresAt - Date.now() - 60_000);
    refreshTimer.current = window.setTimeout(() => {
      void refreshSession();
    }, delay);
  }

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persistAuth(response);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Login failed";
      setError(message);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth, request]);

  const signup = useCallback(async (payload: SignupPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      persistAuth(response);
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : "Signup failed";
      setError(message);
      throw signupError;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth, request]);

  const logout = useCallback(async () => {
    const tokenToRevoke = localStorage.getItem(REFRESH_TOKEN_KEY) ?? refreshToken;
    clearAuth();
    if (tokenToRevoke) {
      try {
        await request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: tokenToRevoke }),
        });
      } catch {
        // Local logout should still succeed when the server is unavailable.
      }
    }
  }, [clearAuth, refreshToken, request]);

  const apiFetch = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? accessToken;
    const makeRequest = (bearer: string | null) =>
      fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          ...init.headers,
        },
      });

    let response = await makeRequest(token);
    if (response.status === 401) {
      const newToken = await refreshSession();
      if (newToken) {
        response = await makeRequest(newToken);
      }
    }
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }, [accessToken, refreshSession]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user !== null && roles.includes(user.role);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiFetch<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(me);
          scheduleRefresh(token, 900);
        }
      } catch {
        await refreshSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isAuthenticated: user !== null && accessToken !== null,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshSession,
    clearError,
    apiFetch,
    hasRole,
  }), [accessToken, apiFetch, clearError, error, hasRole, isLoading, login, logout, refreshSession, signup, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    return JSON.stringify(body.detail ?? body);
  } catch {
    return response.statusText || "Request failed";
  }
}
