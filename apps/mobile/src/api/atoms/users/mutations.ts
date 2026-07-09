import { usersGetMe } from "@monorepo/core/api";
import { atomWithMutation } from "jotai-tanstack-query";

export const usersGetMeAtom = atomWithMutation(
    () => ({
        mutationKey: ["getMe"],
        mutationFn: usersGetMe,
    })
);
