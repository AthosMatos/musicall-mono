import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AuthTokens } from "@monorepo/core";
import { authLogin, authLogout, authRegister, usersGetMe, type UserResponseDto } from "@monorepo/core/api";
import { api, setAccessToken } from "./api";
import { AuthContext, useAuth, type AuthStatus } from "./auth-context";
import { queryClient } from "./query";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserResponseDto | null>(null);

  // Restore the session from the httpOnly refresh cookie on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await api.request<AuthTokens>("/api/auth/refresh", {
          method: "POST",
          anonymous: true,
        });
        setAccessToken(tokens.accessToken);
        const me = await usersGetMe();
        if (cancelled) return;
        setUser(me);
        setStatus("signedIn");
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishSignIn = useCallback(async (tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    const me = await usersGetMe();
    setUser(me);
    setStatus("signedIn");
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await finishSignIn(await authLogin({ email, password }));
    },
    [finishSignIn],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await finishSignIn(await authRegister({ name, email, password }));
    },
    [finishSignIn],
  );

  const logout = useCallback(async () => {
    try {
      await authLogout({});
    } catch {
      // revoking a dead session is fine
    }
    setAccessToken(null);
    setUser(null);
    setStatus("signedOut");
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Route guard: renders children only when signed in. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="min-h-svh bg-bg" />;
  }
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
