export default function ClientTabSkeleton({ tab }: { tab: string }) {
  // puoi differenziare per tab se vuoi
  if (tab === "sessions") return <SessionsSkeleton />;
  if (tab === "packages") return <PackagesSkeleton />;
  if (tab === "progress") return <ProgressSkeleton />;
  return <OverviewSkeleton />; // default
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-pulse">
      {children}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <Shell>
      {/* righe cards come nello screenshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="cf-card h-[170px]" />
        <div className="cf-card h-[170px]" />
        <div className="cf-card h-[170px]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="cf-card h-[160px]" />
        <div className="cf-card h-[160px]" />
        <div className="hidden lg:block" />
      </div>

      <div className="cf-card h-[230px]" />
      <div className="cf-card h-[320px]" />
    </Shell>
  );
}

function PackagesSkeleton() {
  return (
    <Shell>
      <div className="cf-surface cf-hairline overflow-hidden">
        <div className="p-6">
          <div className="h-5 w-40 rounded-xl cf-surface" />
          <div className="mt-2 h-4 w-72 rounded-xl cf-surface" />
        </div>
        <div className="px-6 pb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="cf-card h-[260px]" />
          <div className="cf-card h-[260px]" />
        </div>
      </div>
    </Shell>
  );
}

function SessionsSkeleton() {
  return (
    <Shell>
      <div className="cf-surface cf-hairline overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="h-5 w-28 rounded-xl cf-surface" />
            <div className="mt-2 h-4 w-60 rounded-xl cf-surface" />
          </div>
          <div className="h-10 w-32 rounded-2xl cf-surface" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5">
              <div className="h-4 w-48 rounded-xl cf-surface" />
              <div className="mt-3 h-4 w-72 rounded-xl cf-surface" />
              <div className="mt-3 flex gap-2">
                <div className="h-7 w-20 rounded-2xl cf-surface" />
                <div className="h-7 w-20 rounded-2xl cf-surface" />
                <div className="h-7 w-28 rounded-2xl cf-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ProgressSkeleton() {
  return (
    <Shell>
      <div className="rounded-3xl border cf-surface p-6">
        <div className="h-5 w-44 rounded-xl cf-surface" />
        <div className="mt-2 h-4 w-72 rounded-xl cf-surface" />

        <div className="mt-6 rounded-3xl border cf-surface overflow-hidden">
          <div className="p-6">
            <div className="h-5 w-28 rounded-xl cf-surface" />
            <div className="mt-2 h-4 w-40 rounded-xl cf-surface" />
          </div>

          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5">
                <div className="h-4 w-56 rounded-xl cf-surface" />
                <div className="mt-3 h-4 w-80 rounded-xl cf-surface" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <div key={j} className="h-6 w-20 rounded-full cf-surface" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 cf-card h-[160px]" />
      </div>
    </Shell>
  );
}