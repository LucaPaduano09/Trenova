"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrainerTenantChannel } from "@trenova/contracts";
import { getWebAblyClient } from "@/app/app/_components/realtime/ably-web";

type BookingToast = {
  id: number;
  title: string;
  body: string;
};

function getToastCopy(eventName: string) {
  if (eventName === "booking.requested") {
    return {
      title: "Nuova richiesta",
      body: "Una richiesta di prenotazione e appena arrivata nella tua agenda.",
    };
  }

  if (eventName === "booking.approved") {
    return {
      title: "Richiesta confermata",
      body: "La richiesta e stata confermata e la vista booking e stata aggiornata.",
    };
  }

  if (eventName === "booking.rejected") {
    return {
      title: "Richiesta rifiutata",
      body: "La richiesta e stata rifiutata e la timeline e stata riallineata.",
    };
  }

  return null;
}

export default function BookingRealtimeBridge({
  tenantId,
  enabled,
}: {
  tenantId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<BookingToast | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const client = getWebAblyClient();

    if (!client) {
      return;
    }

    const channel = client.channels.get(getTrainerTenantChannel(tenantId));
    const listener = (message: { name?: string }) => {
      const copy = getToastCopy(message.name ?? "");

      if (copy) {
        setToast({
          id: Date.now(),
          title: copy.title,
          body: copy.body,
        });
      }

      router.refresh();
    };

    void channel.subscribe(listener).catch(() => {
      return;
    });

    return () => {
      void channel.unsubscribe(listener);
    };
  }, [enabled, router, tenantId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-6 top-24 z-[70] w-full max-w-sm">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1628]/95 p-4 text-white shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
              Live update
            </p>
            <p className="mt-1 text-base font-semibold text-white">{toast.title}</p>
            <p className="mt-1 text-sm leading-6 text-white/72">{toast.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
