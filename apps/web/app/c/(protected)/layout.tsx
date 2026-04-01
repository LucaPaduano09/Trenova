import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import Image from "next/image";
import { logout } from "@/actions/logout";
import ClientUserMenu from "./_components/ClientUserMenu";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

export default async function ClientProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { client } = await getCurrentClient();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-[-80px] h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-140px] top-[18%] h-[300px] w-[300px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 28%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 28%, transparent 85%)",
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-white/8 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/c"
                className="text-lg font-semibold tracking-[-0.02em]"
              >
                <Image
                  alt="brand-image"
                  src={"/landing/logo-esteso.png"}
                  width={200}
                  height={100}
                />
              </Link>

              <div className="hidden h-5 w-px bg-white/10 md:block" />

              <nav className="hidden items-center gap-2 md:flex">
                <NavLink href="/c">Dashboard</NavLink>
                <NavLink href="/c/workouts">Workout</NavLink>
                <NavLink href="/c/sessions">Sessioni</NavLink>
                <NavLink href="/c/profile">Profilo</NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {client.tenantId ? (
                <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 sm:inline-flex">
                  Collegato a un PT
                </div>
              ) : (
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 sm:inline-flex">
                  Nessun PT collegato
                </div>
              )}

              <ClientUserMenu
                fullName={client.fullName}
                email={client.email}
                hasTenant={!!client.tenantId}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-20 px-4 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-[26px] border border-white/10 bg-white/[0.05] p-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <Link
            href="/c"
            className="flex-1 rounded-2xl px-3 py-2 text-center text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/c/workouts"
            className="flex-1 rounded-2xl px-3 py-2 text-center text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            Workout
          </Link>
          <Link
            href="/c/sessions"
            className="flex-1 rounded-2xl px-3 py-2 text-center text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            Sessioni
          </Link>
          <Link
            href="/c/profile"
            className="flex-1 rounded-2xl px-3 py-2 text-center text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            Profilo
          </Link>
        </div>
      </div>
    </div>
  );
}
