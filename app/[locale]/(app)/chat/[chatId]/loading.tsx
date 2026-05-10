export default function Loading() {
  return (
    <main className="absolute inset-0 mx-auto flex max-w-[430px] flex-col bg-bone">
      <header className="flex items-center gap-3 border-b border-line bg-white px-3 pb-3 pt-14">
        <div className="h-9 w-9 animate-pulse rounded-md bg-paper" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-paper" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 animate-pulse rounded bg-paper" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-paper" />
        </div>
      </header>
      <div className="flex-1 space-y-2 px-3 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`h-8 animate-pulse rounded-2xl bg-paper`}
              style={{ width: `${40 + ((i * 13) % 35)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line bg-white p-3">
        <div className="h-11 flex-1 animate-pulse rounded-md bg-paper" />
        <div className="h-11 w-11 animate-pulse rounded-md bg-paper" />
      </div>
    </main>
  );
}
