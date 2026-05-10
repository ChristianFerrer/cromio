export function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4">
      <h3 className="mb-2 font-display text-sm text-text">{title}</h3>
      <div className="h-64">
        {empty ? (
          <div className="grid h-full place-items-center text-xs text-text-2">
            sin datos
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
