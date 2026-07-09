import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createJSONStorage } from "jotai/utils";
import type { AsyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";

// Storage adapter para AsyncStorage (usado para dados do usuário)
const asyncStringStorage: AsyncStringStorage = {
	getItem: async (key: string): Promise<string | null> => {
		try {
			return await AsyncStorage.getItem(key);
		} catch (e) {
			console.error("[asyncStringStorage.getItem] Error:", e);
			return null;
		}
	},
	setItem: async (key: string, value: string): Promise<void> => {
		try {
			await AsyncStorage.setItem(key, value);
		} catch (e) {
			console.error("[asyncStringStorage.setItem] Error:", e);
		}
	},
	removeItem: async (key: string): Promise<void> => {
		try {
			await AsyncStorage.removeItem(key);
		} catch {
			// Ignorar erro se não existir
		}
	},
};

// Criar storage JSON para objetos (User)
export const asyncStorage = createJSONStorage(() => asyncStringStorage);

// Storage adapter para SecureStore (usado para token)
export const secureStorage: AsyncStringStorage = {
	getItem: async (key: string): Promise<string | null> => {
		try {
			return await SecureStore.getItemAsync(key);
		} catch (e) {
			console.error("[secureStorage.getItem] Error:", e);
			return null;
		}
	},
	setItem: async (key: string, value: string): Promise<void> => {
		try {
			await SecureStore.setItemAsync(key, value);
		} catch (e) {
			console.error("[secureStorage.setItem] Error:", e);
		}
	},
	removeItem: async (key: string): Promise<void> => {
		try {
			await SecureStore.deleteItemAsync(key);
		} catch {
			// Ignorar erro se não existir
		}
	},
};

/**
 * Storage customizado que trata null corretamente
 * Quando o valor é null, remove o item do storage em vez de armazenar "null"
 */
const nullSafeTokenStorage: AsyncStringStorage = {
	getItem: async (key: string): Promise<string | null> => {
		try {
			const value = await secureStorage.getItem(key);
			// Se for null ou a string "null", retornar null
			if (value === null || value === "null") {
				// Limpar o valor inválido do storage
				await secureStorage.removeItem(key);
				return null;
			}
			// Se for JSON válido, fazer parse
			try {
				const parsed = JSON.parse(value);
				// Se o parse retornar null, limpar e retornar null
				if (parsed === null) {
					await secureStorage.removeItem(key);
					return null;
				}
				return value;
			} catch {
				return value;
			}
		} catch {
			return null;
		}
	},
	setItem: async (key: string, value: string): Promise<void> => {
		if (__DEV__) {
			console.log("[tokenStorage.setItem] Salvando token no SecureStore", {
				key,
				valueLength: value?.length || 0,
				valuePreview: value ? `${value.substring(0, 20)}...` : "null",
			});
		}
		// Se o valor for a string "null", remover o item
		if (value === "null") {
			await secureStorage.removeItem(key);
			return;
		}
		await secureStorage.setItem(key, value);
		if (__DEV__) {
			console.log("[tokenStorage.setItem] Token salvo no SecureStore");
		}
	},
	removeItem: async (key: string): Promise<void> => {
		await secureStorage.removeItem(key);
	},
};

export const tokenStorage = createJSONStorage(() => nullSafeTokenStorage);