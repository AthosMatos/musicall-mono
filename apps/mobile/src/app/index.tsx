import { hasOnboarded, useProfile } from "@/db";
import { Redirect } from "expo-router";

export default function IndexPage() {
  const profile = useProfile();

  return hasOnboarded(profile) ? (
    <Redirect href="/(app)/(tabs)/home" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
}
