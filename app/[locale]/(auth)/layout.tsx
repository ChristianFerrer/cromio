export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-bone md:max-w-[480px]">
      {children}
    </div>
  );
}
