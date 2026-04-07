import Image from "next/image";
import Link from "next/link";
import CinematicKinetiqLoop from "./components/CinematicKinetiqLoop";
import LandingRevealShell from "./components/LandingRevealShell";
import { PerChiEKinetiq } from "./components/PerChi";
import { FooterKinetiq } from "./components/FooterKinetiq";
import CookieBanner from "./components/CookieBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LandingPage() {
  return (
    <LandingRevealShell>
      <div className="min-h-screen bg-black text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-32 right-[-180px] h-[560px] w-[560px] rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute bottom-[-240px] left-1/3 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute left-1/2 top-16 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <header className="relative mx-auto max-w-6xl px-6 pt-5">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.08),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-y-5 right-[350px] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent xl:block" />

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="max-w-lg">
                  <Image
                    alt="brand"
                    width={250}
                    height={101}
                    priority
                    className="block object-contain object-left"
                    src={"/landing/logo-esteso.png"}
                  />
                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/38">
                    Sistema premium per personal trainer e clienti
                  </p>
                </div>
              </div>

              <div className="xl:max-w-md">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                        Accessi rapidi
                      </div>
                      <div className="mt-2 text-base font-medium leading-7 text-white/78">
                        Entra nell’area giusta e accedi subito al tuo workspace.
                      </div>
                    </div>
                    <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200 xl:block">
                      Live
                    </div>
                  </div>

                  <nav className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/app/sign-in?type=pt"
                      className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black shadow-[0_12px_30px_rgba(255,255,255,0.12)] transition hover:opacity-95"
                    >
                      Area PT
                    </Link>
                    <Link
                      href="/c/sign-in?type=client"
                      className="rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-medium text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
                    >
                      Area Cliente
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-6 pb-20">
          <section className="grid items-start gap-12 pt-10 lg:grid-cols-[1.04fr_0.96fr] lg:pt-14">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-white/70 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
                Workspace premium per PT e Clienti
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-[4.35rem]">
                L’esperienza più{" "}
                <span className="relative bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,255,200,0.6)]">
                  elegante
                </span>{" "}
                per gestire coaching, sessioni e clienti.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                Trenova unisce <span className="text-white">clienti</span>,{" "}
                <span className="text-white">sessioni</span>,{" "}
                <span className="text-white">pagamenti</span> e{" "}
                <span className="text-white">progressi</span> in un’unica
                esperienza prodotto: più controllo operativo, più valore
                percepito, meno attrito in ogni momento del lavoro.
              </p>
              <div className="block lg:hidden relative aspect-[16/10]">
                <Image
                  src="/landing/hero-image.png"
                  alt="Training"
                  fill
                  className="object-cover opacity-85"
                  priority
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  Magic link
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  Email + password
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  Multi-tenant
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  Portale cliente
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -left-10 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full bg-blue-500/15 blur-[120px] lg:block" />
              <div className="hidden lg:block relative overflow-hidden rounded-[34px] bg-white/[0.045] ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.25),transparent_45%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(52, 211, 153, 0.6),transparent_45%)]" />

                <div className="relative aspect-[16/10]">
                  <Image
                    src="/landing/hero-image.png"
                    alt="Training"
                    fill
                    className="object-cover opacity-85"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Vista coach
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      Dashboard che comunica valore
                    </div>
                  </div>
                  <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Feeling
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <div className="text-2xl font-semibold text-white"></div>
                      <div className="pb-1 text-sm text-white/60">
                        per PT e clienti
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <MiniGlass
                    title="Sessioni"
                    subtitle="Accetta • Rifiuta • Organizza"
                    image="/landing/sessioni-image.png"
                  />
                  <MiniGlass
                    title="Clienti"
                    subtitle="Anagrafica • Pacchetti • Storico"
                    image="/landing/clienti-image.png"
                  />
                  <MiniGlass
                    title="Progressi"
                    subtitle="Peso • Foto • Misure"
                    image="/landing/progressi-image.png"
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-yellow-400/15 blur-2xl" />
            </div>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                Operativita
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Zero caos
              </div>
              <div className="mt-2 max-w-sm text-sm leading-7 text-white/60">
                Prenotazioni, follow-up e storico in un flusso unico.
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                Percezione
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Premium
              </div>
              <div className="mt-2 max-w-sm text-sm leading-7 text-white/60">
                Interfaccia curata per dare al tuo brand un’altra presenza.
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                Relazione
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Retention
              </div>
              <div className="mt-2 max-w-sm text-sm leading-7 text-white/60">
                Cliente più seguito, percorso più chiaro, esperienza più forte.
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-3">
            <FeatureCard
              title="Sessioni & Pagamenti"
              desc="Crea sessioni in 10 secondi. Prezzo, metodo, pagata/non pagata. Storico pulito."
            />
            <FeatureCard
              title="Portale Cliente"
              desc="Il cliente accede e vede solo ciò che gli serve: sessioni, pagamenti e progressi."
            />
            <FeatureCard
              title="Design premium"
              desc="Glass UI, dark-mode perfetta, micro-interazioni. Sembra un prodotto Apple."
            />
          </section>

          <section className="mt-10 overflow-hidden rounded-[34px] bg-white/[0.045] ring-1 ring-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
            <div className="p-7">
              <div className="text-sm font-semibold">
                Come funziona (semplice)
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <Step
                  n="01"
                  title="PT crea account"
                  desc="Auto-tenant + dashboard pronta."
                />
                <Step
                  n="02"
                  title="Aggiunge clienti & sessioni"
                  desc="Note, prezzo, pagamenti, storico."
                />
                <Step
                  n="03"
                  title="Cliente accede"
                  desc="Vede sessioni e progressi."
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 px-7 py-6 lg:flex-row">
              <div>
                <div className="text-base font-semibold">Pronto a partire?</div>
                <div className="mt-1 text-sm text-white/70">
                  Crea il tuo spazio in Trenova e prova il flusso completo.
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app/sign-in?type=pt&mode=register"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:opacity-95"
                >
                  Crea account PT
                </Link>
                <Link
                  href="/c/sign-in?type=client&mode=register"
                  className="rounded-2xl bg-white/5 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
                >
                  Crea accesso Cliente
                </Link>
              </div>
            </div>
          </section>
          <PerChiEKinetiq />
          <section className="mx-auto max-w-6xl px-6 py-16">
            <div className="mt-10 block lg:hidden">
              <CinematicKinetiqLoop height={200} />
            </div>
            <div className="mt-10 hidden lg:block">
              <CinematicKinetiqLoop height={420} />
            </div>
          </section>
          <section className="relative py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-cyan-500/5 to-blue-500/5" />
            <div className="absolute -top-48 right-0 w-[700px] h-[500px] bg-blue-500/10 blur-[160px] rounded-full" />
            <div className="absolute -bottom-48 left-0 w-[700px] h-[500px] bg-emerald-400/10 blur-[160px] rounded-full" />

            <div className="relative max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold text-white">
                  Perché Trenova è{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    diverso
                  </span>
                </h2>
                <p className="text-white/60 mt-5 max-w-2xl mx-auto">
                  Non è un gestionale “in più”. È il sistema che mette ordine,
                  misura i risultati e ti aiuta a crescere.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {[
                  "Zero caos",
                  "Tutto sotto controllo",
                  "Progressi misurabili",
                  "Pronto per crescere",
                ].map((t) => (
                  <div
                    key={t}
                    className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/70 backdrop-blur"
                  >
                    {t}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-10">
                {[
                  {
                    title: "Addio caos operativo",
                    subtitle: "Stop a WhatsApp + app sparse + note volanti.",
                    bullets: [
                      "Sessioni, clienti e progressi in un unico flusso",
                      "Meno errori, più tempo per allenare",
                    ],
                  },
                  {
                    title: "Dati che motivano",
                    subtitle:
                      "I risultati si vedono, si misurano, si condividono.",
                    bullets: [
                      "Storico chiaro e consultabile",
                      "Trend e progressi che spingono la retention",
                    ],
                  },
                  {
                    title: "Sistema che scala con te",
                    subtitle: "Da coach singolo a studio strutturato.",
                    bullets: [
                      "Organizzazione pronta per crescere",
                      "Processi chiari: meno fatica, più controllo",
                    ],
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="group relative p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-emerald-400/30"
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                      <div className="absolute -left-1/2 top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-160%] group-hover:translate-x-[260%] transition-all duration-[1800ms]" />
                    </div>

                    <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                    <h3 className="text-xl font-semibold text-white mb-2">
                      {c.title}
                    </h3>
                    <p className="text-white/60 mb-6">{c.subtitle}</p>

                    <ul className="space-y-3">
                      {c.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 text-white/70"
                        >
                          <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="absolute -inset-6 rounded-[32px] opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 blur-2xl pointer-events-none" />
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4">
                <Link
                  href={"/app/sign-in?type=pt&mode=register"}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-semibold shadow-[0_0_30px_rgba(0,255,200,0.35)] hover:scale-[1.03] transition"
                >
                  Inizia ora
                </Link>
                <p className="text-white/50 text-sm">
                  Configuri tutto in pochi minuti.
                </p>
              </div>
            </div>
          </section>
          <FooterKinetiq />
        </main>
        <CookieBanner />
      </div>
    </LandingRevealShell>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] bg-white/[0.045] p-6 ring-1 ring-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition duration-500 hover:-translate-y-1.5 hover:bg-white/[0.065]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)] opacity-70" />
      <div className="relative">
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-2 text-sm leading-7 text-white/70">{desc}</p>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-blue-400/40 via-white/10 to-yellow-300/40" />
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-[24px] bg-white/[0.045] p-5 ring-1 ring-white/10 backdrop-blur-xl">
      <div className="text-xs text-white/50">{n}</div>
      <div className="mt-1 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </div>
  );
}

function MiniGlass({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle: string;
  image: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white/[0.045] ring-1 ring-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="relative h-30">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover opacity-70 transition duration-300 group-hover:opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-white/70">{subtitle}</div>
      </div>
    </div>
  );
}
