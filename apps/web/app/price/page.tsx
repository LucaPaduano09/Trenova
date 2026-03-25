import { FooterKinetiq } from "../components/FooterKinetiq";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "€10",
      period: "/mese",
      desc: "Per iniziare e mettere ordine.",
      highlight: false,
      features: [
        "Clienti illimitati",
        "Sessioni e calendario",
        "Tracking progressi base",
        "Note e storico",
        "Supporto email",
      ],
      cta: "Inizia con Starter",
    },
    {
      name: "Pro",
      price: "€29",
      period: "/mese",
      desc: "Il piano più scelto per crescere.",
      highlight: true,
      features: [
        "Tutto di Starter",
        "Progressi avanzati e trend",
        "Template programmi",
        "Automazioni e reminder",
        "Priorità supporto",
      ],
      cta: "Passa a Pro",
    },
    {
      name: "Studio",
      price: "Su misura",
      period: "",
      desc: "Per studi e team con più coach.",
      highlight: false,
      features: [
        "Multi-coach e ruoli",
        "Dashboard team",
        "Reporting avanzato",
        "Onboarding dedicato",
        "Integrazioni su richiesta",
      ],
      cta: "Parla con noi",
    },
  ];

  const faqs = [
    {
      q: "Posso provare Trenova prima di pagare?",
      a: "Sì. Puoi partire con una prova gratuita (o con il piano Starter) e passare a Pro quando vuoi.",
    },
    {
      q: "Posso cambiare piano in qualsiasi momento?",
      a: "Certo. Upgrade/downgrade sono immediati e mantieni sempre i tuoi dati.",
    },
    {
      q: "Ci sono limiti su clienti o sessioni?",
      a: "No: i clienti sono illimitati. Trenova è pensato per scalare con te.",
    },
    {
      q: "Offrite fatturazione annuale?",
      a: "Sì, puoi attivarla in fase di checkout (di solito con sconto).",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-400/10 blur-[170px] rounded-full" />
      <div className="absolute -bottom-40 right-0 w-[900px] h-[520px] bg-blue-500/10 blur-[160px] rounded-full" />
      <div className="absolute inset-0 opacity-40 pointer-events-none [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(closest-side_at_50%_20%,rgba(0,0,0,1),rgba(0,0,0,0))]" />

      <div className="relative max-w-6xl mx-auto px-6 py-24">

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-semibold text-white">
            Prezzi{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              semplici
            </span>
            , risultati seri.
          </h1>
          <p className="text-white/60 mt-6 max-w-2xl mx-auto">
            Scegli il piano giusto per il tuo modo di lavorare. Nessun caos,
            tutto sotto controllo.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={[
                "group relative rounded-3xl p-8 border backdrop-blur-xl",
                p.highlight
                  ? "bg-white/[0.06] border-emerald-400/30 shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_30px_90px_rgba(0,0,0,0.65)]"
                  : "bg-white/[0.04] border-white/10 hover:border-white/20",
                "transition-all duration-500 hover:-translate-y-2",
              ].join(" ")}
            >

              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute -left-1/2 top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-160%] group-hover:translate-x-[260%] transition-all duration-[1800ms]" />
              </div>

              {p.highlight && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-200 text-xs mb-6">
                  Più scelto
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold text-white">{p.name}</h2>
              </div>

              <p className="text-white/60 mt-2">{p.desc}</p>

              <div className="mt-8 flex items-end gap-2">
                <div className="text-5xl font-semibold text-white">
                  {p.price}
                </div>
                <div className="text-white/50 mb-1">{p.period}</div>
              </div>

              <button
                className={[
                  "mt-8 w-full py-3 rounded-2xl font-semibold transition",
                  p.highlight
                    ? "bg-gradient-to-r from-emerald-400 to-blue-500 text-black shadow-[0_0_30px_rgba(0,255,200,0.25)] hover:scale-[1.01]"
                    : "bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.08]",
                ].join(" ")}
              >
                {p.cta}
              </button>

              <div className="mt-8 text-white/50 text-sm font-semibold">
                Incluso:
              </div>

              <ul className="mt-4 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-white/70">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div
                className={[
                  "absolute -inset-6 rounded-[36px] blur-2xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none",
                  p.highlight
                    ? "bg-gradient-to-br from-emerald-400/12 to-blue-500/12"
                    : "bg-gradient-to-br from-white/6 to-transparent",
                ].join(" ")}
              />
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
          <span className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10">
            Pagamenti sicuri
          </span>
          <span className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10">
            Cancelli quando vuoi
          </span>
          <span className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10">
            Dati sempre tuoi
          </span>
        </div>

        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-semibold text-white text-center">
            Domande{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              frequenti
            </span>
          </h3>

          <div className="mt-10 grid gap-6">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-7"
              >
                <div className="text-white font-semibold">{f.q}</div>
                <div className="text-white/60 mt-2 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center mb-24">
          <div className="inline-block rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-10">
            <h4 className="text-3xl md:text-4xl font-semibold text-white">
              Pronto a portare{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ordine
              </span>{" "}
              nel tuo coaching?
            </h4>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">
              Inizia ora e costruisci un sistema che ti fa risparmiare tempo e
              aumenta la retention.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 text-black font-semibold shadow-[0_0_30px_rgba(0,255,200,0.25)] hover:scale-[1.02] transition">
                Inizia gratis
              </button>
              <button className="px-8 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white font-semibold hover:bg-white/[0.08] transition">
                Contattaci
              </button>
            </div>
          </div>
        </div>
        <FooterKinetiq />
      </div>
    </main>
  );
}
