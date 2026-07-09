import { atomWithStorage } from "jotai/utils";
import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { secureStorage, tokenStorage } from "../../../src/utils/jotai-storage.utils";

export const TOKEN_KEY = "auth_token";

export const authTokenAtom = atomWithStorage<string | null>(
	TOKEN_KEY,
	null,
	tokenStorage as AsyncStorage<string | null>
);

export const getToken = async (): Promise<string | null> => {
	try {
		const raw = await secureStorage.getItem(TOKEN_KEY);
		if (raw === null || raw === "null") {
			await secureStorage.removeItem(TOKEN_KEY);
			return null;
		}
		// The value may be stored as JSON string (with surrounding quotes), so parse it
		try {
			const parsed = JSON.parse(raw);
			if (typeof parsed === "string" && parsed.length > 0) {
				return parsed;
			}
			if (parsed === null) {
				await secureStorage.removeItem(TOKEN_KEY);
				return null;
			}
		} catch {
			// Not valid JSON, return raw value
		}
		return raw;
	} catch {
		return null;
	}
}