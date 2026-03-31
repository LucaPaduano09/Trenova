import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let permissionStatus = existingPermissions.status;

  if (permissionStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermissions.status;
  }

  if (permissionStatus !== "granted") {
    return null;
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const pushToken = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return {
    expoPushToken: pushToken.data,
    platform: Platform.OS,
    deviceName: Device.deviceName ?? null,
    appOwnership: null,
  };
}

export async function showRealtimeBookingNotification(args: {
  title: string;
  body: string;
  href?: string | null;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: args.title,
      body: args.body,
      data: {
        href: args.href ?? "/c/sessions",
      },
    },
    trigger: null,
  });
}

export function mapNotificationHrefToAppPath(href?: string | null) {
  if (!href) {
    return "/(tabs)";
  }

  if (href.startsWith("/c/sessions")) {
    return "/(tabs)/sessions";
  }

  if (href.startsWith("/c/workouts")) {
    return "/(tabs)/workouts";
  }

  if (href.startsWith("/c")) {
    return "/(tabs)";
  }

  return "/(tabs)";
}
