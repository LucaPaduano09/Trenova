"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavItem({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
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
          "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-2.5 text-sm",
          "transition-all duration-200",
          active
            ? "text-white shadow-sm"
            : "cf-text hover:bg-neutral-100 hover:-translate-y-[1px]",
        ].join(" ")}
      >
        {/* Active animated gradient background */}
        {active && (
          <>
            {/* base gradient */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-950 opacity-95" />
            {/* subtle moving sheen */}
            <span className="pointer-events-none absolute -left-1/2 top-0 h-full w-[200%] opacity-30 animate-[navsheen_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            {/* soft inner glow */}
            <span className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
          </>
        )}

        {/* Dot */}
        <span
          className={[
            "relative z-10 h-1.5 w-1.5 rounded-full transition-all duration-200",
            active ? "bg-white" : "bg-transparent group-hover:bg-neutral-400",
          ].join(" ")}
        />

        <span className="relative z-10">{children}</span>
      </div>
    </Link>
  );
}
