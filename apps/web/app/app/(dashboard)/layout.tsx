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
  const primaryItems = [
    { href: "/app", label: "Panoramica", eyebrow: "Overview", icon: "OV" },
    { href: "/app/clients", label: "Clienti", eyebrow: "CRM", icon: "CL" },
    { href: "/app/booking", label: "Booking", eyebrow: "Calendar", icon: "BK" },
    {
      href: "/app/exercises",
      label: "Esercizi",
      eyebrow: "Library",
      icon: "EX",
    },
    {
      href: "/app/workouts",
      label: "Workouts",
      eyebrow: "Programming",
      icon: "WO",
    },
    {
      href: "/app/packages",
      label: "Pacchetti",
      eyebrow: "Revenue",
      icon: "PK",
    },
    {
      href: "/app/settings/availability",
      label: "Disponibilita",
      eyebrow: "Schedule",
      icon: "AV",
    },
  ] as const;

  return (
    <nav className="space-y-5 text-sm">
      <div>
        <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.18em] cf-faint">
          Workspace
        </div>
        <div className="space-y-2">
          {primaryItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              eyebrow={item.eyebrow}
              icon={item.icon}
            >
              {item.label}
            </NavItem>
          ))}
        </div>
      </div>

      <div className="border-t border-black/5 pt-4 dark:border-white/10">
        <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.18em] cf-faint">
          Sessione
        </div>
        <NavItem href="/api/auth/signout" eyebrow="Account" icon="SO">
          Sign out
        </NavItem>
      </div>
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/45 bg-white/44 px-4 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur-[24px] dark:border-white/10 dark:bg-[rgba(12,20,36,0.68)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_76%_10%,rgba(16,185,129,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02)_30%,transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_24%),radial-gradient(circle_at_76%_10%,rgba(16,185,129,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_28%,transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/70 dark:bg-white/18" />

      <div className="relative">
        <div className="mb-6 rounded-[30px] border border-white/40 bg-white/34 px-4 py-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035]">
          <div className="text-[11px] uppercase tracking-[0.22em] cf-faint">
            Trenova
          </div>
          <div className="mt-3 flex items-center justify-center rounded-[26px] border border-white/45 bg-white/50 px-4 py-7 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none">
            <BrandLogo className="w-[176px]" />
          </div>
        </div>

        <SidebarNav />
      </div>
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
    [],
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
