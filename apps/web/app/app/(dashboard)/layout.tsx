import type { ReactNode } from "react";
import NavItem from "../_components/Navitem";
import ThemeToggle from "../../../components/ThemeToggle";
import Image from "next/image";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* soft background */}
      <div className="pointer-events-none fixed inset-0 opacity-60 dark:opacity-35">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
        <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-neutral-200 blur-3xl dark:bg-white/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 p-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 rounded-3xl border bg-white/70 dark:bg-white/5 p-4 backdrop-blur-xl shadow-sm border-neutral-200/70 dark:border-white/10">
            <div className="mb-4">
              <Image
                alt="brand-logo"
                width={200}
                height={100}
                src={"/landing/brand-image.png"}
              />
            </div>

            <nav className="space-y-1 text-sm cf-text">
              <NavItem href="/app">Panoramica</NavItem>
              <NavItem href="/app/clients">Clienti</NavItem>
              <NavItem href="/app/booking">Booking</NavItem>
              <NavItem href="/app/exercises">Esercizi</NavItem>
              <NavItem href="/app/workouts">Workouts</NavItem>

              <div className="mt-4 border-t border-neutral-200/70 dark:border-white/10 pt-4">
                <NavItem href="/api/auth/signout">Sign out</NavItem>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <div className="sticky top-6 z-10 mb-6 rounded-3xl border bg-white/70 dark:bg-white/5 px-4 py-3 backdrop-blur-xl shadow-sm border-neutral-200/70 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium cf-text dark:text-neutral-200">
                Dashboard
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
