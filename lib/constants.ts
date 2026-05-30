export const DEFAULT_REPORTER_RATE_IDR = 2000;
export const DEFAULT_EDITOR_FEE_IDR = 50000;

export enum JOB_STATUS {
  NEW,
  ASSIGNED,
  TRANSCRIBED,
  REVIEWED,
  COMPLETED,
  CANCELLED,
}

export type JobStatusValue = JOB_STATUS;

export const JOB_STATUS_LABELS: Record<JOB_STATUS, string> = {
  [JOB_STATUS.NEW]: "NEW",
  [JOB_STATUS.ASSIGNED]: "ASSIGNED",
  [JOB_STATUS.TRANSCRIBED]: "TRANSCRIBED",
  [JOB_STATUS.REVIEWED]: "REVIEWED",
  [JOB_STATUS.COMPLETED]: "COMPLETED",
  [JOB_STATUS.CANCELLED]: "CANCELLED",
};

export const JOB_STATUS_OPTIONS = Object.values(JOB_STATUS)
  .filter((value): value is JOB_STATUS => typeof value === "number")
  .map((value) => ({
    value,
    label: JOB_STATUS_LABELS[value],
  }));

export const NEXT_JOB_STATUS: Partial<Record<JOB_STATUS, JOB_STATUS>> = {
  [JOB_STATUS.NEW]: JOB_STATUS.ASSIGNED,
  [JOB_STATUS.ASSIGNED]: JOB_STATUS.TRANSCRIBED,
  [JOB_STATUS.TRANSCRIBED]: JOB_STATUS.REVIEWED,
  [JOB_STATUS.REVIEWED]: JOB_STATUS.COMPLETED,
};

export const INDONESIAN_CITIES = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Medan",
  "Denpasar",
  "Makassar",
  "Semarang",
] as const;
