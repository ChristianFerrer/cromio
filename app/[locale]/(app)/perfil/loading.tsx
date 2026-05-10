export default function Loading() {
  return (
    <main className="px-5 pb-6 pt-14">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 animate-pulse rounded bg-paper" />
        <div className="h-10 w-10 animate-pulse rounded-md bg-paper" />
      </div>
      <section className="mt-5 flex flex-col items-center gap-2">
        <div className="h-20 w-20 animate-pulse rounded-full bg-paper" />
        <div className="h-5 w-40 animate-pulse rounded bg-paper" />
        <div className="h-3 w-28 animate-pulse rounded bg-paper" />
      </section>
      <div className="mt-5 h-32 animate-pulse rounded-md bg-paper" />
      <div className="mt-5 h-24 animate-pulse rounded-md bg-paper" />
      <div className="mt-5 h-44 animate-pulse rounded-md bg-paper" />
    </main>
  );
}
