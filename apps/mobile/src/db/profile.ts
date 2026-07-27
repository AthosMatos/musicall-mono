import { useObject } from "./realm";
import { PROFILE_ID, UserProfile } from "./schemas";

/** The single profile row, live — `null` until onboarding creates it. */
export function useProfile(): UserProfile | null {
  return useObject(UserProfile, PROFILE_ID);
}

/**
 * Onboarding is finished once the profile has a name. The language screen
 * creates the row with an empty name, so "row exists" alone is not enough.
 */
export function hasOnboarded(profile: UserProfile | null): boolean {
  return !!profile && profile.name.trim().length > 0;
}
