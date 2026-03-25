export default function CommandCenterLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-64 bg-surface-raised rounded-lg mb-2" />
        <div className="h-4 w-80 bg-surface-raised rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass border border-surface-border rounded-lg px-4 py-3 text-center"
          >
            <div className="h-8 w-12 bg-surface-raised rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-surface-raised rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="glass border border-surface-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-surface-raised rounded" />
              <div className="h-5 w-32 bg-surface-raised rounded" />
            </div>
            <div className="h-4 w-full bg-surface-raised rounded mb-1" />
            <div className="h-4 w-3/4 bg-surface-raised rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
