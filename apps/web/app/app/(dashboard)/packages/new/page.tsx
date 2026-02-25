export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add package</h1>
        <p className="mt-1 text-sm cf-muted">
          Client: <span className="font-medium">{client ?? "—"}</span>
        </p>
      </div>

      <div className="rounded-3xl border bg-white/70 p-6 shadow-sm backdrop-blur-xl">
        <div className="text-sm font-medium">Coming next</div>
        <p className="mt-2 text-sm cf-muted">
          Qui scegliamo tipo pacchetto (10/20), prezzo, validità e generiamo i
          credit.
        </p>
      </div>
    </div>
  );
}
