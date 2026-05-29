export const DEFAULT_REPORTER_RATE_IDR = 2000;
export const DEFAULT_EDITOR_FEE_IDR = 50000;

export const JOB_STATUS = {
  NEW: 0,
  ASSIGNED: 1,
  TRANSCRIBED: 2,
  REVIEWED: 3,
  COMPLETED: 4,
} as const;

export type JobStatusValue = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUS_LABELS: Record<JobStatusValue, string> = {
  [JOB_STATUS.NEW]: "NEW",
  [JOB_STATUS.ASSIGNED]: "ASSIGNED",
  [JOB_STATUS.TRANSCRIBED]: "TRANSCRIBED",
  [JOB_STATUS.REVIEWED]: "REVIEWED",
  [JOB_STATUS.COMPLETED]: "COMPLETED",
};

export const JOB_STATUS_OPTIONS = Object.entries(JOB_STATUS_LABELS).map(
  ([value, label]) => ({
    value: Number(value) as JobStatusValue,
    label,
  }),
);

export const NEXT_JOB_STATUS: Partial<Record<JobStatusValue, JobStatusValue>> = {
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
