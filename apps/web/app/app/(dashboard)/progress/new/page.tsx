export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log progress</h1>
        <p className="mt-1 text-sm cf-muted">
          Client: <span className="font-medium">{client ?? "—"}</span>
        </p>
      </div>

      <div className="cf-card cf-hairline">
        <div className="text-sm font-medium">Coming next</div>
        <p className="mt-2 text-sm cf-muted">
          Qui logghiamo peso, misure, foto e note con timestamp.
        </p>
      </div>
    </div>
  );
}
