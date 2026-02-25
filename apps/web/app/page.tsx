import Image from "next/image";
import Link from "next/link";
import CinematicKinetiqLoop from "./components/CinematicKinetiqLoop";
import { PerChiEKinetiq } from "./components/PerChi";
import { FooterKinetiq } from "./components/FooterKinetiq";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-32 right-[-180px] h-[560px] w-[560px] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-[-240px] left-1/3 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* Topbar */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          {/* <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur"> */}
          {/* <span className="text-sm font-semibold tracking-tight">
              <span className="text-blue-400">C</span>
              <span className="text-yellow-300">F</span>
            </span> */}
          {/* </div> */}
          <div className="leading-tight">
            <div className="text-sm font-semibold">
              <Image
                alt="brand"
                width={245}
                height={101}
                src={"/landing/brand-image.png"}
              />
            </div>
            {/* <div className="text-xs text-white/60">Minimal • Fast • Clean</div> */}
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/app/sign-in?type=pt&mode=login"
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
          >
            Area PT
          </Link>
          <Link
            href="/c/sign-in?type=client&mode=login"
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
          >
            Area Cliente
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-20">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-300/80" />
              Dashboard premium per PT e Clienti
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Il modo più{" "}
              <span className="relative bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,255,200,0.6)]">
                elegante
              </span>{" "}
              di gestire allenamenti, sessioni e pagamenti.
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70">
              Kinetiq.io unisce <span className="text-white">clienti</span>,{" "}
              <span className="text-white">sessioni</span>,{" "}
              <span className="text-white">pagamenti</span> e{" "}
              <span className="text-white">progressi</span> in un’esperienza
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
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app/sign-in?type=pt&mode=register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black shadow-sm hover:opacity-95"
              >
                Sono un PT → Crea account
                <span className="opacity-60 transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <Link
                href="/c/sign-in?type=client&mode=register"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
              >
                Sono un Cliente → Crea accesso
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
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

          {/* Right: image + glass cards */}
          <div className="relative">
            <div className="hidden lg:block relative overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.25),transparent_45%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(52, 211, 153, 0.6),transparent_45%)]" />

              {/* hero image */}
              <div className="relative aspect-[16/10]">
                <Image
                  src="/landing/hero-image.png"
                  alt="Training"
                  fill
                  className="object-cover opacity-85"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              </div>

              {/* floating mini-cards */}
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <MiniGlass
                  title="Sessioni"
                  subtitle="Pagata / da pagare • prezzo • note"
                  image="/landing/sessioni-image.png"
                />
                <MiniGlass
                  title="Clienti"
                  subtitle="Anagrafica • pacchetti • storico"
                  image="/landing/clienti-image.png"
                />
                <MiniGlass
                  title="Progressi"
                  subtitle="Peso • foto • misure (in arrivo)"
                  image="/landing/progressi-image.png"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-yellow-400/15 blur-2xl" />
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

        <section className="mt-10 overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
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
                Crea il tuo spazio in Kinetiq.io e prova il flusso completo.
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
          {/* background */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-cyan-500/5 to-blue-500/5" />
          <div className="absolute -top-48 right-0 w-[700px] h-[500px] bg-blue-500/10 blur-[160px] rounded-full" />
          <div className="absolute -bottom-48 left-0 w-[700px] h-[500px] bg-emerald-400/10 blur-[160px] rounded-full" />

          <div className="relative max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-white">
                Perché Kinetiq è{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  diverso
                </span>
              </h2>
              <p className="text-white/60 mt-5 max-w-2xl mx-auto">
                Non è un gestionale “in più”. È il sistema che mette ordine,
                misura i risultati e ti aiuta a crescere.
              </p>
            </div>

            {/* value pills */}
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

            {/* cards */}
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
                  {/* light beam */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <div className="absolute -left-1/2 top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-160%] group-hover:translate-x-[260%] transition-all duration-[1800ms]" />
                  </div>

                  {/* top accent */}
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

                  {/* glow */}
                  <div className="absolute -inset-6 rounded-[32px] opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 blur-2xl pointer-events-none" />
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 flex flex-col items-center gap-4">
              <Link
                href={"/app/sign-in?type=pt&mode=register"}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 text-black font-semibold shadow-[0_0_30px_rgba(0,255,200,0.35)] hover:scale-[1.03] transition"
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
    </div>
  );
}

/* ---------- UI bits ---------- */

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur hover:bg-white/7">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-blue-400/40 via-white/10 to-yellow-300/40" />
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
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
    <div className="group relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
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
