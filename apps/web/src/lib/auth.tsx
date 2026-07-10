import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AuthTokens } from "@monorepo/core";
import { authLogin, authLogout, authRegister, usersGetMe, type UserResponseDto } from "@monorepo/core/api";
import { refreshSession, setAccessToken } from "./api";
import { AuthContext, useAuth, type AuthStatus } from "./auth-context";
import { queryClient } from "./query";

/**
 * The refresh cookie is httpOnly (invisible to JS), so this flag mirrors
 * "a session was started here". It lets a signed-out visitor (e.g. on /login)
 * skip the doomed POST /auth/refresh probe on every page load.
 */
const HAS_SESSION_KEY = "musicall.has-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserResponseDto | null>(null);

  // Restore the session from the httpOnly refresh cookie on load. `refreshSession`
  // dedupes concurrent calls, so StrictMode's double-mounted effect only rotates
  // the single-use refresh token once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!localStorage.getItem(HAS_SESSION_KEY)) {
        setStatus("signedOut");
        return;
      }
      const token = await refreshSession();
      if (cancelled) return;
      if (!token) {
        setStatus("signedOut");
        return;
      }
      try {
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
    localStorage.setItem(HAS_SESSION_KEY, "1");
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
    localStorage.removeItem(HAS_SESSION_KEY);
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
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg">
        <span className="font-mono text-sm text-faint">restaurando sessão…</span>
      </div>
    );
  }
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
