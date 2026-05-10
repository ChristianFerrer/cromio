export default function Loading() {
  return (
    <main className="px-5 pb-6 pt-14">
      <div className="h-8 w-32 animate-pulse rounded bg-paper" />
      <div className="mt-1 h-3 w-24 animate-pulse rounded bg-paper" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-paper" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-paper" />
              <div className="h-3 w-48 animate-pulse rounded bg-paper" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
