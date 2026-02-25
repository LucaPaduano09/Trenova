"use client";

export function FooterKinetiq() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-emerald-500/5 to-blue-500/5" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-400/8 blur-[170px] rounded-full" />

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
          {/* brand */}
          <div className="max-w-sm">
            <div className="text-2xl font-semibold text-white">
              Kinetiq
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                .io
              </span>
            </div>
            <p className="text-white/60 mt-3 leading-relaxed">
              Il sistema di controllo per coach e studi fitness: sessioni,
              clienti e progressi, tutto in un unico posto.
            </p>
          </div>

          {/* newsletter */}
          {/* <div className="w-full lg:max-w-md">
            <div className="text-white/80 font-semibold mb-3">Ricevi update</div>
            <p className="text-white/60 text-sm mb-4">
              Novità prodotto, feature e release. Zero spam.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: collega al tuo endpoint (es. /api/newsletter)
                alert("Iscrizione inviata (demo)");
              }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-emerald-400/10 to-blue-500/10 blur-2xl opacity-80 pointer-events-none" />
              <div className="relative flex gap-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-2">
                <input
                  type="email"
                  required
                  placeholder="La tua email"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/40 px-3 py-3"
                />
                <button
                  type="submit"
                  className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 text-black font-semibold hover:scale-[1.02] transition shadow-[0_0_28px_rgba(0,255,200,0.25)]"
                >
                  Iscriviti
                </button>
              </div>
              <div className="mt-2 text-xs text-white/40">
                Iscrivendoti accetti la nostra informativa privacy.
              </div>
            </form>
          </div> */}

          {/* links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 text-sm">
            <div>
              <div className="text-white/80 font-semibold mb-3">Prodotto</div>
              <ul className="space-y-2 text-white/60">
                <li>
                  <a
                    className="hover:text-white transition"
                    href="/#come-funziona"
                  >
                    Come funziona
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/#features">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/pricing">
                    Prezzi
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white/80 font-semibold mb-3">Risorse</div>
              <ul className="space-y-2 text-white/60">
                <li>
                  <a className="hover:text-white transition" href="/#faq">
                    FAQ
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/#support">
                    Supporto
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/#contatti">
                    Contatti
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white/80 font-semibold mb-3">Legale</div>
              <ul className="space-y-2 text-white/60">
                <li>
                  <a className="hover:text-white transition" href="/privacy">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/terms">
                    Termini
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="/cookies">
                    Cookie
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © {year} Kinetiq.io. Tutti i diritti riservati.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition"
            >
              Instagram
            </a>
            <a
              href="#"
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
