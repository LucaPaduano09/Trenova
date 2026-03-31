import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PushNotificationsBridge } from "@/src/components/PushNotificationsBridge";
import { AuthProvider } from "@/src/providers/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PushNotificationsBridge />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0B1324" },
        }}
      />
    </AuthProvider>
  );
}
