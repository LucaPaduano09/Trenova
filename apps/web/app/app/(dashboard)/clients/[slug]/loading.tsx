export default function LoadingClientDetail() {
  return (
    <div className="space-y-6 cf-text animate-pulse">

      <div className="cf-card cf-hairline p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl border cf-surface" />
            <div className="min-w-0 flex-1">
              <div className="h-7 w-56 rounded-xl cf-surface" />
              <div className="mt-3 h-4 w-72 rounded-xl cf-surface" />
              <div className="mt-4 flex items-center gap-2">
                <div className="h-9 w-24 rounded-2xl cf-surface" />
                <div className="h-9 w-24 rounded-2xl cf-surface" />
              </div>
            </div>
          </div>

          <div className="cf-card">
            <div className="h-4 w-32 rounded-xl cf-surface" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-14 rounded-2xl cf-surface" />
              <div className="h-14 rounded-2xl cf-surface" />
              <div className="h-14 rounded-2xl cf-surface" />
              <div className="h-14 rounded-2xl cf-surface" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-6 z-10 cf-surface cf-hairline p-2">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 rounded-2xl cf-surface" />
          <div className="h-9 w-24 rounded-2xl cf-surface" />
          <div className="h-9 w-24 rounded-2xl cf-surface" />
          <div className="h-9 w-24 rounded-2xl cf-surface" />
        </div>
      </div>

      <div className="cf-surface cf-hairline overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div>
            <div className="h-5 w-28 rounded-xl cf-surface" />
            <div className="mt-2 h-4 w-72 rounded-xl cf-surface" />
          </div>
          <div className="h-10 w-32 rounded-2xl cf-surface" />
        </div>

        <div className="px-6 pb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="cf-card">
            <div className="h-4 w-40 rounded-xl cf-surface" />
            <div className="mt-2 h-3 w-64 rounded-xl cf-surface" />
            <div className="mt-4 space-y-3">
              <div className="h-10 rounded-2xl cf-surface" />
              <div className="h-10 rounded-2xl cf-surface" />
              <div className="h-10 w-32 ml-auto rounded-2xl cf-surface" />
            </div>
          </div>

          <div className="cf-card">
            <div className="h-4 w-44 rounded-xl cf-surface" />
            <div className="mt-2 h-3 w-64 rounded-xl cf-surface" />
            <div className="mt-4 space-y-3">
              <div className="h-16 rounded-2xl cf-surface" />
              <div className="h-16 rounded-2xl cf-surface" />
              <div className="h-16 rounded-2xl cf-surface" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}