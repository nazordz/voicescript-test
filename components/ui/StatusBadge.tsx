import { JOB_STATUS, JOB_STATUS_LABELS } from "@/lib/constants";

const STATUS_CLASSES: Record<number, string> = {
  [JOB_STATUS.NEW]: "badge-ghost",
  [JOB_STATUS.ASSIGNED]: "badge-info",
  [JOB_STATUS.TRANSCRIBED]: "badge-warning",
  [JOB_STATUS.REVIEWED]: "badge-secondary",
  [JOB_STATUS.COMPLETED]: "badge-success",
};

export function StatusBadge({ status }: { status: number }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status] ?? "badge-ghost"}`}>
      {JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS] ?? "UNKNOWN"}
    </span>
  );
}
