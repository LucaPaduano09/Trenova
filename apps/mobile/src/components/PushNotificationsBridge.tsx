import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { getClientUserChannel } from "@trenova/contracts";
import { apiClient } from "@/src/lib/api";
import { getMobileAblyClient } from "@/src/lib/realtime";
import {
  mapNotificationHrefToAppPath,
  registerForPushNotificationsAsync,
  showRealtimeBookingNotification,
} from "@/src/lib/push-notifications";
import { useAuth } from "@/src/providers/AuthProvider";

export function PushNotificationsBridge() {
  const router = useRouter();
  const { status, accessToken, me } = useAuth();
  const registeredForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !me?.user.id) {
      registeredForUserRef.current = null;
      return;
    }

    if (registeredForUserRef.current === me.user.id) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const payload = await registerForPushNotificationsAsync();

        if (!payload || !isActive) {
          return;
        }

        await apiClient.registerMobilePushDevice(payload);

        if (isActive) {
          registeredForUserRef.current = me.user.id;
        }
      } catch {
        registeredForUserRef.current = null;
      }
    })();

    return () => {
      isActive = false;
    };
  }, [accessToken, me?.user.id, status]);

  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const href =
          typeof response.notification.request.content.data?.href === "string"
            ? response.notification.request.content.data.href
            : null;

        router.push(mapNotificationHrefToAppPath(href));
      });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !me?.user.id) {
      return;
    }

    const client = getMobileAblyClient(accessToken);

    if (!client) {
      return;
    }

    const channel = client.channels.get(getClientUserChannel(me.user.id));
    const listener = (message: {
      name?: string;
      data?: {
        title?: string;
        body?: string;
        href?: string;
      };
    }) => {
      if (
        message.name !== "booking.approved" &&
        message.name !== "booking.rejected"
      ) {
        return;
      }

      if (!message.data?.title || !message.data.body) {
        return;
      }

      void showRealtimeBookingNotification({
        title: message.data.title,
        body: message.data.body,
        href: message.data.href ?? "/c/sessions",
      });
    };

    void channel.subscribe(listener);

    return () => {
      void channel.unsubscribe(listener);
    };
  }, [accessToken, me?.user.id, status]);

  return null;
}
