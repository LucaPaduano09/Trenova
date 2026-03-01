import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Trenova",
  description: "Cookie Policy della piattaforma Trenova.",
};

export const dynamic = "force-static";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">
            Ultimo aggiornamento: {new Date().getFullYear()}
          </p>
        </header>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">1. Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti salvano sul
            dispositivo dell’utente per migliorare l’esperienza di navigazione,
            abilitare funzioni essenziali e (se previsto) raccogliere
            statistiche.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">
            2. Tipologie di cookie usati
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Cookie tecnici/necessari</strong>: indispensabili per il
              funzionamento del sito e per autenticazione/sicurezza.
            </li>
            <li>
              <strong>Cookie di preferenza</strong>: memorizzano scelte (es.
              lingua, tema, impostazioni).
            </li>
            <li>
              <strong>Cookie statistici/analytics</strong>: ci aiutano a capire
              come viene usato il sito (solo se abilitati dove richiesto).
            </li>
            <li>
              <strong>Cookie di marketing</strong>: usati per profilazione/adv
              (solo con consenso, se presenti).
            </li>
          </ul>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">3. Gestione del consenso</h2>
          <p>
            Dove richiesto, Trenova mostra un banner/cmp per gestire il consenso
            ai cookie non necessari. Puoi modificare le preferenze in qualsiasi
            momento dalle impostazioni cookie (se presente) o dal tuo browser.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">
            4. Come disabilitare i cookie
          </h2>
          <p>
            Puoi gestire o disabilitare i cookie tramite le impostazioni del tuo
            browser. Disabilitare i cookie necessari può influire sul corretto
            funzionamento del sito.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">5. Cookie di terze parti</h2>
          <p>
            In base ai servizi attivi (es. analytics, provider pagamenti,
            strumenti di supporto), potrebbero essere installati cookie di terze
            parti. L’elenco specifico dipende dalle integrazioni attive sul
            sito/app.
          </p>
        </section>

        <footer className="pt-12 text-sm text-muted-foreground">
          Ultimo aggiornamento: {new Date().getFullYear()} — Trenova
        </footer>
      </div>
    </main>
  );
}
