export function ListStateView({
  isLoading,
  rows,
}: {
  isLoading: boolean;
  rows: number;
}) {
  if (isLoading) {
    return <div className="py-4 text-sm text-base-content/60">Loading...</div>;
  }

  if (rows === 0) {
    return <div className="py-4 text-sm text-base-content/60">No rows</div>;
  }

  return null;
}
