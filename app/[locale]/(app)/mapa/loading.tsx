export default function Loading() {
  return (
    <main className="absolute inset-0 overflow-hidden bg-bone">
      <div className="absolute inset-0 z-0 animate-pulse bg-paper" />
      <div className="absolute right-3 top-14 z-30 flex items-center gap-2">
        <div className="h-10 w-20 animate-pulse rounded-card bg-white shadow-sh2" />
        <div className="h-10 w-10 animate-pulse rounded-card bg-white shadow-sh2" />
      </div>
      <div className="absolute bottom-24 left-3 right-3 z-30 rounded-xl border border-black/5 bg-white/95 p-3.5 shadow-sh3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-3 w-32 animate-pulse rounded bg-paper" />
          <div className="h-6 w-12 animate-pulse rounded bg-paper" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-7 flex-1 animate-pulse rounded bg-paper" />
          ))}
        </div>
      </div>
    </main>
  );
}
