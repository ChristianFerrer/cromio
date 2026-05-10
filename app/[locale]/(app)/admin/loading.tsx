export default function AdminLoading() {
  return (
    <main className="px-4 pb-6 pt-12 md:px-6">
      <div className="h-7 w-48 animate-pulse rounded bg-line" />
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-6 w-12 animate-pulse rounded-full bg-line"
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-md border border-line bg-white"
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-md border border-line bg-white"
          />
        ))}
      </div>
    </main>
  );
}
