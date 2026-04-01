import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { FooterKinetiq } from "@/app/components/FooterKinetiq";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ClientAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-100px] top-[-60px] h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[18%] h-[300px] w-[300px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 30%, transparent 88%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 30%, transparent 88%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">

        <header className="border-b border-white/6">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/landing/logo-esteso.png"
                alt="Trenova"
                width={120}
                height={40}
                priority
                className="h-auto w-[112px] opacity-95"
              />
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:bg-white/[0.07] hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/app/sign-in"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:bg-white/[0.07] hover:text-white"
              >
                Area PT
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-12 lg:min-h-[calc(100vh-110px)] lg:grid-cols-[0.9fr_1.1fr]">

            <section className="hidden lg:block">
              <div className="max-w-[500px]">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 backdrop-blur">
                  Area Cliente
                </div>

                <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                  Il tuo percorso,
                  <br />
                  sempre con te.
                </h1>

                <p className="mt-5 max-w-[470px] text-[15px] leading-7 text-white/62">
                  Accedi alla tua area personale per vedere allenamenti,
                  sessioni, progressi e dettagli del tuo percorso con il tuo PT,
                  in un’esperienza semplice, pulita e premium.
                </p>

                <div className="mt-8 grid max-w-[470px] grid-cols-2 gap-3">
                  {[
                    {
                      title: "Sessioni",
                      body: "Controlla appuntamenti e stato delle prenotazioni.",
                    },
                    {
                      title: "Workout",
                      body: "Consulta la scheda attiva e il tuo piano corrente.",
                    },
                    {
                      title: "Progressi",
                      body: "Segui i miglioramenti nel tempo in modo ordinato.",
                    },
                    {
                      title: "Accesso facile",
                      body: "Magic link o password, in base a come preferisci entrare.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
                    >
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/58">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-[760px] xl:max-w-[800px]">
                {children}
              </div>
            </section>
          </div>
        </main>
      </div>
      <FooterKinetiq />
    </div>
  );
}