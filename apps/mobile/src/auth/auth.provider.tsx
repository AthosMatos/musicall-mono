import { usersGetMeAtom } from "@/api/atoms/users/mutations";
import { setLogoutCallback } from "@/api/config";
import { authTokenAtom } from "@/atoms/auth/token";
import { userAtom } from "@/atoms/auth/user";
import { LoginInput, RegisterInput, User } from "@monorepo/core";
import { useNetInfo } from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import {
	createContext,
	type PropsWithChildren,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState
} from "react";
import { loginAtom, logoutAtom, registerAtom } from "../api/atoms/auth/mutations";

interface AuthContextProps {
	login: {
		isPending: boolean;
		error: unknown;
		signIn: (formValues: LoginInput) => Promise<void>;
	};
	logout: {
		isPending: boolean;
		error: unknown;
		signOut: () => Promise<void>;
	};
	register: {
		isPending: boolean;
		error: unknown;
		register: (formValues: RegisterInput) => Promise<void>;
	};
	isLoggedIn: boolean;
	isConnected: boolean;
}

const AuthContext = createContext<AuthContextProps | null>(null);

// Use this hook to access the user info.
export function useAuth() {
	const value = use(AuthContext);
	if (!value) {
		throw new Error("useAuth must be wrapped in a <AuthSessionProvider />");
	}

	return value;
}

SplashScreen.preventAutoHideAsync();

export function AuthProvider({ children }: PropsWithChildren) {
	const [isMounted, setIsMounted] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	const [authToken, setAuthToken] = useAtom(authTokenAtom);

	const logout = useSetAtom(logoutAtom);
	const setUser = useSetAtom(userAtom);

	const {
		mutateAsync: loginAsync,
		isPending: loginIsPending,
		error: loginError,
	} = useAtomValue(loginAtom);
	const {
		mutateAsync: registerAsync,
		isPending: registerIsPending,
		error: registerError,
	} = useAtomValue(registerAtom);

	const {
		mutateAsync: getMeAsync,
		isPending: getMeIsPending,
		error: getMeError,
	} = useAtomValue(usersGetMeAtom);
	const queryClient = useAtomValue(queryClientAtom);

	const netInfo = useNetInfo();

	const isConnected = useMemo(() => !!netInfo.isConnected, [netInfo.isConnected]);


	const saveAuthStates = ({ token, user }: { token?: string; user: User }) => {
		token && setAuthToken(token);
		setUser(user);
	};

	const signIn = useCallback(
		async (formValues: LoginInput) => {
			try {
				if (queryClient) {
					queryClient.removeQueries();
					queryClient.clear();
				}
				const response = await loginAsync({
					email: formValues.email,
					password: formValues.password,
				});

				// Sem credenciais armazenadas (mock): nada a autenticar.
				if (!response) return;

				const { accessToken } = response;
				const user = await getMeAsync();
				console.log("Login bem-sucedido:", accessToken, user);

				// Salvar estados de autenticação com jotai storage
				saveAuthStates({ token: accessToken, user });
				setIsLoggedIn(true)
				//router.dismissAll();
			} catch (error) {
				throw error;
			}
		},
		[queryClient]
	);

	const register = useCallback(
		async (formValues: RegisterInput) => {
			try {
				if (queryClient) {
					queryClient.removeQueries();
					queryClient.clear();
				}
				const response = await registerAsync(formValues);

				// Sem credenciais armazenadas (mock): nada a autenticar.
				if (!response) return;

				const { accessToken } = response;
				const user = await getMeAsync();
				console.log("Registro bem-sucedido:", accessToken, user);

				// Salvar estados de autenticação com jotai storage
				saveAuthStates({ token: accessToken, user });
				setIsLoggedIn(true)
				//router.dismissAll();
			} catch (error) {
				throw error;
			}
		},
		[queryClient]
	);

	const signOut = useCallback(async () => {
		try {
			setIsLoggedIn(false)
			// logoutAtom já cancela/limpa o queryClient e remove TODAS as chaves
			// persistidas do usuário (token, user, address, credenciais, etc).
			await logout();
		} catch (error) {
			if (__DEV__) {
				console.error("[AuthProvider] Erro ao fazer logout:", error);
			}
		}
	}, []);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Register the logout callback for the axios 401 interceptor
	useEffect(() => {
		setLogoutCallback(signOut);

		return () => {
			setLogoutCallback(null);
		};
	}, [signOut]);


	useEffect(() => {
		if (isMounted) {
			setTimeout(() => {
				SplashScreen.hideAsync().catch((e) => {
					console.warn("Erro ao esconder splash screen:", e);
				});
			}, 500);
		}
	}, [isMounted]);


	useEffect(() => {
		authToken && setIsLoggedIn(true)
	}, [authToken])

	return (
		<AuthContext.Provider
			value={{
				login: {
					isPending: loginIsPending,
					error: loginError,
					signIn,

				},
				logout: {
					isPending: false,
					error: null,
					signOut,
				},
				register: {
					isPending: registerIsPending,
					error: registerError,
					register,
				},
				/* forgotPassword: {
					isPending: forgotPasswordIsPending,
					error: forgotPasswordError,
					resetPassword,
				}, */
				isLoggedIn,
				isConnected,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
