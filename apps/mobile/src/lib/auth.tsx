import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthTokens } from "@monorepo/core";
import { authLogin, authLogout, authRegister, usersGetMe, type UserResponseDto } from "@monorepo/core/api";
import { clearTokens, getStoredRefreshToken, loadStoredAccessToken, setTokens } from "./api";
import { queryClient } from "./query";

type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: AuthStatus;
  user: UserResponseDto | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserResponseDto | null>(null);

  // Restore the session from the keychain; an expired access token is
  // refreshed transparently by the ApiClient on the first 401.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadStoredAccessToken();
        const me = await usersGetMe();
        if (cancelled) return;
        setUser(me);
        setStatus("signedIn");
      } catch {
        if (cancelled) return;
        setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishSignIn = useCallback(async (tokens: AuthTokens) => {
    await setTokens(tokens);
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
      const refreshToken = await getStoredRefreshToken();
      if (refreshToken) await authLogout({ refreshToken });
    } catch {
      // revoking a dead session is fine
    }
    await clearTokens();
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
