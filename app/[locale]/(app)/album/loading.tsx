export default function Loading() {
  return (
    <main className="px-5 pb-6 pt-14">
      <div className="h-8 w-40 animate-pulse rounded bg-paper" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-paper" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-card bg-paper" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-card bg-paper"
          />
        ))}
      </div>
    </main>
  );
}
