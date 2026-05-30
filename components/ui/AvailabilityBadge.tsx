export function AvailabilityBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`badge ${value ? "badge-success" : "badge-ghost"}`}
      data-testid="availability-badge"
    >
      {value ? "Available" : "Unavailable"}
    </span>
  );
}
