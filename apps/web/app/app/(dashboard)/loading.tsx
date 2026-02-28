export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-64 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cf-card h-28 flex flex-col justify-between">
            <div className="h-4 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-6 w-20 rounded-lg bg-neutral-300 dark:bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="cf-card h-72 space-y-4">
          <div className="h-4 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-full w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
        </div>

        <div className="cf-card h-72 space-y-4">
          <div className="h-4 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-full w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>

      {/* Calendar block */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="cf-card h-96" />
        <div className="cf-card h-96" />
      </div>
    </div>
  );
}
