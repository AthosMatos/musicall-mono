import { useAuth } from "@/auth/auth.provider";
import { Redirect } from "expo-router";

export default function IndexPage() {
  const { isLoggedIn } = useAuth();

  return isLoggedIn ? <Redirect href="/(protected)/(tabs)/home" /> : <Redirect href="/(auth)" />;
}
