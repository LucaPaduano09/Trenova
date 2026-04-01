"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import NavItem from "../_components/Navitem";
import ThemeToggle from "../../../components/ThemeToggle";
import Image from "next/image";
import NotificationsBell from "../_components/NotificationsBell";

function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={["relative", className].join(" ")}>
      <Image
        alt="brand-logo"
        width={200}
        height={50}
        src="/landing/logo-esteso.png"
        priority
        className="block dark:hidden h-auto w-full object-contain"
      />
      <Image
        alt="brand-logo"
        width={200}
        height={50}
        src="/landing/logo-esteso.png"
        priority
        className="hidden dark:block h-auto w-full object-contain"
      />
    </div>
  );
}

function SidebarNav() {
  return (
    <nav className="space-y-1 text-sm">
      <NavItem href="/app">Panoramica</NavItem>
      <NavItem href="/app/clients">Clienti</NavItem>
      <NavItem href="/app/booking">Booking</NavItem>
      <NavItem href="/app/exercises">Esercizi</NavItem>
      <NavItem href="/app/workouts">Workouts</NavItem>
      <NavItem href="/app/packages">Pacchetti</NavItem>
      <NavItem href="/app/settings/availability">Disponibilita</NavItem>

      <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
        <NavItem href="/api/auth/signout">Sign out</NavItem>
      </div>

      <div className="mt-4 text-xs cf-faint">v1.0 • Dashboard</div>
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="cf-card cf-hairline">
      <div className="mb-4">
        <BrandLogo className="w-[180px]" />
      </div>

      <SidebarNav />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const shellBg = useMemo(
    () => "bg-neutral-50 dark:bg-[var(--background)]",
    []
  );

  return (
    <div className={["min-h-screen", shellBg].join(" ")}>

      <div className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-35">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
        <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
      </div>

      <div
        className={[
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >

        <button
          type="button"
          aria-label="Chiudi menu"
          className={[
            "absolute inset-0 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
            "bg-black/55 backdrop-blur-[2px]",
          ].join(" ")}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={[
            "absolute left-0 top-0 h-full w-[86%] max-w-sm p-3",
            "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="h-full cf-surface cf-hairline overflow-hidden shadow-2xl">

            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
              <BrandLogo className="w-[150px]" />

              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 grid place-items-center rounded-full cf-soft cf-hairline transition hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Chiudi menu"
                type="button"
              >
                <span className="cf-text text-sm">✕</span>
              </button>
            </div>

            <div className="p-4">
              <SidebarNav />
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl gap-6 p-4 sm:p-6">

        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-6">
            <SidebarContent />
          </div>
        </aside>

        <main className="flex-1 min-w-0">

          <div className="sticky top-4 sm:top-6 z-10 mb-4 sm:mb-6 cf-surface cf-hairline px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden rounded-2xl cf-soft cf-hairline px-3 py-2 text-sm"
                  aria-label="Apri menu"
                  type="button"
                >
                  ☰
                </button>

                <div className="text-sm font-semibold cf-text">Dashboard</div>
              </div>

              <div className="flex items-center gap-2">
                <NotificationsBell />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
