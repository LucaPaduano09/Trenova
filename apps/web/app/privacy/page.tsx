import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Trenova",
  description: "Informativa Privacy (GDPR) della piattaforma Trenova.",
};

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Ultimo aggiornamento: {new Date().getFullYear()}
          </p>
        </header>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">1. Titolare del trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati è <strong>Trenova</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Contatto: support@trenova.it
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">2. Dati trattati</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Dati account</strong> (es. email, nome, informazioni
              fornite in fase di registrazione).
            </li>
            <li>
              <strong>Dati di utilizzo</strong> (log tecnici, eventi di
              navigazione, info su dispositivo/browser).
            </li>
            <li>
              <strong>Dati inseriti dall’utente</strong> nella piattaforma (es.
              note, contenuti, informazioni operative).
            </li>
            <li>
              <strong>Dati di pagamento</strong>: gestiti da provider esterni
              (noi non memorizziamo i dati completi della carta).
            </li>
          </ul>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">
            3. Finalità e basi giuridiche
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Erogazione del servizio</strong> (contratto / misure
              precontrattuali).
            </li>
            <li>
              <strong>Supporto e comunicazioni</strong> (contratto e/o legittimo
              interesse).
            </li>
            <li>
              <strong>Adempimenti legali</strong> (obblighi di legge).
            </li>
            <li>
              <strong>Sicurezza e prevenzione abusi</strong> (legittimo
              interesse).
            </li>
            <li>
              <strong>Marketing</strong> (solo se presti consenso, quando
              applicabile).
            </li>
          </ul>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">4. Conservazione dei dati</h2>
          <p>
            Conserviamo i dati per il tempo necessario alle finalità indicate e
            in conformità agli obblighi di legge. Puoi richiedere la
            cancellazione dell’account secondo quanto previsto dai Termini.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">5. Destinatari e fornitori</h2>
          <p>
            I dati possono essere trattati da fornitori che ci supportano
            nell’erogazione del servizio (es. hosting, email, analytics,
            pagamenti), nominati ove necessario responsabili del trattamento.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">6. Trasferimenti extra UE</h2>
          <p>
            Alcuni fornitori possono trattare dati al di fuori dello Spazio
            Economico Europeo. In tali casi adottiamo misure adeguate (es.
            clausole contrattuali standard) secondo normativa applicabile.
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">7. Diritti dell’interessato</h2>
          <p>
            Hai diritto di: accesso, rettifica, cancellazione, limitazione,
            opposizione, portabilità dei dati e revoca del consenso (se
            applicabile).
          </p>
          <p>
            Puoi esercitare i tuoi diritti scrivendo a:{" "}
            <strong>support@trenova.it</strong>
          </p>
        </section>

        <section className="cf-card space-y-4">
          <h2 className="text-xl font-semibold">8. Reclamo</h2>
          <p>
            Se ritieni che il trattamento violi la normativa, puoi proporre
            reclamo al Garante per la Protezione dei Dati Personali.
          </p>
        </section>

        <footer className="pt-12 text-sm text-muted-foreground">
          Ultimo aggiornamento: {new Date().getFullYear()} — Trenova
        </footer>
      </div>
    </main>
  );
}
