import { authTokenAtom, TOKEN_KEY } from "@/atoms/auth/token";
import { StorageKeys } from "@/storage-keys";
import { secureStorage } from "@/utils/jotai-storage.utils";
import { authLogin, authRegister } from "@monorepo/core/api";
import { atom } from "jotai";
import { atomWithMutation, queryClientAtom } from "jotai-tanstack-query";
import { userAtom } from "../../../atoms/auth/user";


// Persisted SecureStore keys that hold user-scoped data and must be wiped on logout.
const SECURE_STORAGE_USER_KEYS = [
    TOKEN_KEY,
    StorageKeys.userCredentials,
];

export const logoutAtom = atom(null, async (get, set) => {
    const queryClient = get(queryClientAtom);

    // 1) Cancelar e limpar TODAS as queries em cache (impede que dados do
    //    usuário anterior apareçam ao trocar de conta).
    if (queryClient) {
        try {
            await queryClient.cancelQueries();
        } catch {
            // ignore
        }
        queryClient.removeQueries();
        queryClient.clear();
    }

    // 2) Limpar atoms em memória ANTES de remover do storage para evitar que
    //    o atomWithStorage re-grave o valor null como string "null" no AsyncStorage
    //    (subscribers podem disparar setItem após o set).
    set(authTokenAtom, null);
    set(userAtom, null);

    // 4) Remover TODAS as chaves persistidas do usuário em paralelo.
    await Promise.all([
        ...SECURE_STORAGE_USER_KEYS.map((key) => secureStorage.removeItem(key)),

    ]);

    if (__DEV__) {
        console.log("[logoutAtom] User-scoped storage cleared");
    }
});

export const loginAtom = atomWithMutation(
    (get) => ({
        mutationKey: ["login"],
        mutationFn: (credentials: { email: string, password: string }) => {
            return authLogin(credentials)
        },
        onSuccess: async () => {
            const queryClient = get(queryClientAtom);
            await queryClient.invalidateQueries();
        },
        onError: async (error) => {
            console.error("Login failed:", error);
        },
    }),
    (get) => get(queryClientAtom)
);

export const registerAtom = atomWithMutation(
    (get) => ({
        mutationKey: ["register"],
        mutationFn: (credentials: { name: string, email: string, password: string }) => {
            return authRegister(credentials)
        },
        onSuccess: async () => {
            const queryClient = get(queryClientAtom);
            await queryClient.invalidateQueries();
        },
        onError: async (error) => {
            console.error("Login failed:", error);
        },
    }),
    (get) => get(queryClientAtom)
);

/* export const forgotPasswordAtom = atomWithMutation(
    () => ({
        mutationKey: ["forgotPassword"],
        mutationFn: (credentials: LoginCredentials) => authService.forgotPassword(credentials),
        onError: async (error) => {
            console.error("Forgot password failed:", error);
        },
    }),
    (get) => get(queryClientAtom)
); */

