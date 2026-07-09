import { User } from "@monorepo/core";
import { atomWithStorage } from "jotai/utils";
import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { asyncStorage } from "../../../src/utils/jotai-storage.utils";

const USER_KEY = "auth_user";

export const userAtom = atomWithStorage<User | null>(
	USER_KEY,
	null,
	asyncStorage as AsyncStorage<User | null>
);
