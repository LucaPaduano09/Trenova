// app/app/setup/page.tsx
import { auth } from "@/lib/auth";

export default async function SetupPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Setup required</h1>
        <p className="mt-2 text-sm cf-muted">
          Il tuo account non è ancora collegato a un tenant (workspace).
        </p>

        <div className="mt-4 rounded-xl border p-3 text-xs cf-muted">
          <div>Email: {session?.user?.email ?? "—"}</div>
          <div>tenantId: {(session?.user as any)?.tenantId ?? "—"}</div>
        </div>

        <p className="mt-4 text-sm">
          Soluzione: collega l’utente a un tenant (bootstrap) o elimina l’utente
          e rifai login.
        </p>
      </div>
    </div>
  );
}
