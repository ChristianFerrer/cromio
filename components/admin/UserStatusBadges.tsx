export function UserStatusBadges({
  isAdmin,
  bannedAt,
}: {
  isAdmin: boolean;
  bannedAt: string | null;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {isAdmin && (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
          admin
        </span>
      )}
      {bannedAt && (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
          banned
        </span>
      )}
    </span>
  );
}
