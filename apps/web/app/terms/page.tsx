

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termini e Condizioni | Trenova",
  description: "Termini e Condizioni di utilizzo della piattaforma Trenova.",
};

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-20">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Termini e Condizioni
          </h1>
          <p className="text-sm text-muted-foreground">
            Ultimo aggiornamento: {new Date().getFullYear()}
          </p>
        </header>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">1. Accettazione dei Termini</h2>
          <p>
            Utilizzando Trenova accetti integralmente i presenti Termini e
            Condizioni. Se non accetti anche solo una parte di questi termini,
            ti invitiamo a non utilizzare la piattaforma.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">2. Descrizione del Servizio</h2>
          <p>
            Trenova è una piattaforma software che consente la gestione,
            organizzazione e digitalizzazione di attività professionali tramite
            strumenti web e mobile.
          </p>
          <p>
            Il servizio può includere funzionalità gratuite e piani a pagamento.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">3. Account</h2>
          <p>
            Per utilizzare alcune funzionalità è necessario creare un account.
            L’utente è responsabile della sicurezza delle proprie credenziali e
            di ogni attività svolta tramite il proprio profilo.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">4. Abbonamenti e Pagamenti</h2>
          <p>
            Alcune funzionalità possono richiedere un abbonamento attivo. I
            prezzi, le modalità di pagamento e le condizioni di rinnovo sono
            indicate nella sezione dedicata del sito.
          </p>
          <p>
            Gli abbonamenti si rinnovano automaticamente salvo disdetta prima
            della data di rinnovo.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">5. Uso Consentito</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>È vietato utilizzare Trenova per attività illegali.</li>
            <li>
              È vietato tentare di compromettere la sicurezza del sistema.
            </li>
            <li>
              È vietata la copia, distribuzione o modifica del software senza
              autorizzazione.
            </li>
          </ul>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">6. Proprietà Intellettuale</h2>
          <p>
            Tutti i diritti relativi al software, al marchio Trenova,
            all’interfaccia e ai contenuti sono di proprietà esclusiva del
            titolare.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">
            7. Limitazione di Responsabilità
          </h2>
          <p>
            Trenova viene fornita “così com’è”. Non garantiamo l’assenza di
            errori o interruzioni del servizio.
          </p>
          <p>
            Nei limiti consentiti dalla legge, non siamo responsabili per
            eventuali danni diretti o indiretti derivanti dall’uso della
            piattaforma.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">8. Modifiche</h2>
          <p>
            Ci riserviamo il diritto di modificare i presenti Termini in
            qualsiasi momento. Le modifiche avranno effetto dalla data di
            pubblicazione.
          </p>
        </section>

        <section className="cf-card space-y-6">
          <h2 className="text-xl font-semibold">9. Legge Applicabile</h2>
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi
            controversia sarà competente il foro previsto dalla normativa
            vigente.
          </p>
        </section>

        <footer className="pt-12 text-sm text-muted-foreground">
          Per qualsiasi richiesta: support@trenova.it
        </footer>
        <Link href={"/"}>Torna alla Home </Link>
      </div>
    </main>
  );
}
