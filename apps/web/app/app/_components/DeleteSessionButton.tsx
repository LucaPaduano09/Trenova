"use client";

import Image from "next/image";
import { useTransition } from "react";

export default function DeleteSessionButton({
  sessionId,
  action,
  label = "Elimina",
}: {
  sessionId: string;
  action: (formData: FormData) => Promise<any>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        const ok = confirm("Vuoi eliminare questa sessione?");
        if (!ok) return;

        startTransition(async () => {
          fd.set("sessionId", sessionId);
          await action(fd);
        });
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />

      <button
        type="submit"
        disabled={pending}
        className={[
          "group relative inline-flex items-center justify-center gap-2",
          "rounded-2xl px-3 py-2 text-sm font-medium",
          "border cf-surface backdrop-blur-xl",
          "text-red-700 shadow-sm",
          "transition-all duration-200",
          "hover:border-red-300/70 hover:shadow-md",
          "active:scale-[0.98]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {/* subtle red glow */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,rgba(239,68,68,0.18),transparent_60%)]" />
        <span className="relative">
          <Image
            alt="modifica"
            width={16}
            height={16}
            src="/icons/delete-now.svg"
            className="block dark:hidden"
          />
          <Image
            alt="modifica"
            width={16}
            height={16}
            src="/icons/white-delete-now.svg"
            className="hidden dark:block"
          />
        </span>
      </button>
    </form>
  );
}
