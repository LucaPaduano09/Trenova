"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavItem({
  href,
  children,
  eyebrow,
  icon,
}: {
  href: string;
  children: ReactNode;
  eyebrow?: string;
  icon?: string;
}) {
  const pathname = usePathname();

  const active =
    href === "/app"
      ? pathname === "/app"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} prefetch className="group relative block">
      <div
        className={[
          "relative flex items-center gap-3 overflow-hidden rounded-[24px] px-4 py-3.5 text-sm",
          "transition-all duration-200",
          active
            ? "text-white shadow-[0_18px_40px_rgba(15,39,71,0.22)]"
            : "cf-text hover:bg-white/5 hover:-translate-y-[1px]",
        ].join(" ")}
      >

        {active && (
          <>

            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0f2747] via-[#12305a] to-[#0f2747] opacity-95" />

            <span className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />

            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
          </>
        )}

        <span
          className={[
            "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
            active
              ? "border-white/12 bg-white/10 text-white"
              : "border-black/5 bg-white/60 text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200",
          ].join(" ")}
        >
          {icon ?? "•"}
        </span>

        <div className="relative z-10 min-w-0 flex-1">
          {eyebrow ? (
            <div
              className={[
                "text-[10px] uppercase tracking-[0.16em]",
                active ? "text-white/70" : "cf-faint",
              ].join(" ")}
            >
              {eyebrow}
            </div>
          ) : null}
          <div className="truncate text-sm font-medium">{children}</div>
        </div>
      </div>
    </Link>
  );
}
