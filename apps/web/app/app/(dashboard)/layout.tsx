"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavItem from "../_components/Navitem";
import ThemeToggle from "../../../components/ThemeToggle";
import Image from "next/image";

function SidebarContent() {
  return (
    <div className="rounded-3xl border bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:bg-white/5 border-neutral-200/70 dark:border-white/10">
      <div className="mb-4">
        <Image
          alt="brand-logo"
          width={200}
          height={100}
          src={"/landing/brand-image.png"}
          priority
        />
      </div>

      <nav className="space-y-1 text-sm cf-text">
        <NavItem href="/app">Panoramica</NavItem>
        <NavItem href="/app/clients">Clienti</NavItem>
        <NavItem href="/app/booking">Booking</NavItem>
        <NavItem href="/app/exercises">Esercizi</NavItem>
        <NavItem href="/app/workouts">Workouts</NavItem>

        <div className="mt-4 border-t border-neutral-200/70 pt-4 dark:border-white/10">
          <NavItem href="/api/auth/signout">Sign out</NavItem>
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // close drawer on route change (clicking a NavItem)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // lock body scroll when drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // optional: close on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* soft background */}
      <div className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-35">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
        <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
      </div>

      {/* Mobile drawer */}
      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* overlay */}
        <div
          className={[
            "absolute inset-0 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
            "bg-black/55 backdrop-blur-[2px]",
          ].join(" ")}
          onClick={() => setMobileOpen(false)}
        />

        {/* panel */}
        <div
          className={[
            "absolute left-0 top-0 h-full w-[86%] max-w-sm p-3",
            "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="h-full cf-surface cf-hairline overflow-hidden shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight cf-text">
                  Menu
                </span>
                <span className="cf-chip">Kinetiq</span>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 grid place-items-center rounded-full cf-soft cf-hairline transition hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Chiudi menu"
              >
                <span className="cf-text text-sm">✕</span>
              </button>
            </div>

            {/* content */}
            <div className="p-4">
              {/* brand */}
              <div className="mb-4 cf-soft cf-hairline p-3">
                <Image
                  alt="brand-logo"
                  width={220}
                  height={110}
                  src={"/landing/brand-image.png"}
                  priority
                  className="h-auto w-full object-contain"
                />
              </div>

              {/* nav */}
              <div className="space-y-1">
                <NavItem href="/app">Panoramica</NavItem>
                <NavItem href="/app/clients">Clienti</NavItem>
                <NavItem href="/app/booking">Booking</NavItem>
                <NavItem href="/app/exercises">Esercizi</NavItem>
                <NavItem href="/app/workouts">Workouts</NavItem>

                <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-white/10">
                  <NavItem href="/api/auth/signout">Sign out</NavItem>
                </div>

                <div className="mt-4 cf-faint text-xs">v1.0 • Dashboard</div>
              </div>
            </div>

            {/* bottom safe-area */}
            <div className="h-4" />
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 p-4 sm:p-6">
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6">
            <SidebarContent />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="sticky top-4 sm:top-6 z-10 mb-4 sm:mb-6 rounded-3xl border bg-white/70 dark:bg-white/5 px-4 py-3 backdrop-blur-xl shadow-sm border-neutral-200/70 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden rounded-2xl border px-3 py-2 text-sm bg-white/70 dark:bg-white/5 backdrop-blur-xl border-neutral-200/70 dark:border-white/10"
                  aria-label="Apri menu"
                >
                  ☰
                </button>

                <div className="text-sm font-medium cf-text dark:text-neutral-200">
                  Dashboard
                </div>
              </div>

              <div className="flex items-center gap-2">
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
