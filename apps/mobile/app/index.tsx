import { Redirect } from "expo-router";
import { LaunchScreen } from "@/src/components/LaunchScreen";
import { useAuth } from "@/src/providers/AuthProvider";

export default function IndexPage() {
  const { status } = useAuth();

  if (status === "bootstrapping") {
    return <LaunchScreen />;
  }

  return <Redirect href={status === "authenticated" ? "/(tabs)" : "/sign-in"} />;
}
