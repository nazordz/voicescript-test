export function AvailabilityBadge({ value }: { value: boolean }) {
  return (
    <span className={`badge ${value ? "badge-success" : "badge-ghost"}`}>
      {value ? "Available" : "Unavailable"}
    </span>
  );
}
