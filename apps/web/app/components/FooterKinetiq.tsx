"use client";

export function FooterKinetiq() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10">

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-emerald-500/5 to-blue-500/5" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-400/8 blur-[170px] rounded-full" />

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">

          <div className="max-w-sm">
            <div className="text-2xl font-semibold text-white">
              Tre
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                nova
              </span>
            </div>
            <p className="text-white/60 mt-3 leading-relaxed">
              Il sistema di controllo per coach e studi fitness: sessioni,
              clienti e progressi, tutto in un unico posto.
            </p>
          </div>

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
                  <a className="hover:text-white transition" href="/price">
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

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            ©Trenova Tutti i diritti riservati.
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
