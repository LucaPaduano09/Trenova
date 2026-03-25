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
            ? "text-white"
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
            "relative z-10 h-1.5 w-1.5 rounded-full transition-all duration-200",
            active
              ? "bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.7)]"
              : "bg-transparent group-hover:bg-white/40",
          ].join(" ")}
        />

        <span className="relative z-10">{children}</span>
      </div>
    </Link>
  );
}