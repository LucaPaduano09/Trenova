export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import NewClientForm from "../_components/ClientNewForm";

export default async function NewClientPage() {
  return (
    <div className="space-y-6 cf-surface cf-text">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold cf-text tracking-tight">
            Nuovo cliente
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Crea un profilo cliente in pochi secondi.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:bg-white/70 dark:hover:bg-white/10"
        >
          Annulla
        </Link>
      </header>

      <section className="cf-card">
        <NewClientForm />
      </section>
    </div>
  );
}
