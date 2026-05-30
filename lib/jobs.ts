import { Prisma } from "@/generated/prisma";
import {
  JOB_STATUS,
  JOB_STATUS_LABELS,
  NEXT_JOB_STATUS,
  type JobStatusValue,
} from "./constants";

type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    reporter: true;
    editor: true;
    statusHistories: { orderBy: { createdAt: "desc" } };
  };
}>;

export const jobInclude = {
  reporter: true,
  editor: true,
  statusHistories: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.JobInclude;

export function isJobStatus(value: number): value is JobStatusValue {
  return Object.values(JOB_STATUS).some((status) => status === value);
}

export function calculateJobPayments(job: {
  durationMinutes: number;
  reporterRateIdr: number;
  editorFeeIdr: number;
}) {
  const reporterPayoutIdr = job.durationMinutes * job.reporterRateIdr;
  const editorPayoutIdr = job.editorFeeIdr;

  return {
    reporterPayoutIdr,
    editorPayoutIdr,
    totalPayoutIdr: reporterPayoutIdr + editorPayoutIdr,
  };
}

export function serializeJob(job: JobWithRelations) {
  return {
    ...job,
    statusLabel: JOB_STATUS_LABELS[job.status as JobStatusValue] ?? "UNKNOWN",
    payments: calculateJobPayments(job),
  };
}

export function isCancellable(status: number) {
  return (
    isJobStatus(status) &&
    status !== JOB_STATUS.COMPLETED &&
    status !== JOB_STATUS.CANCELLED
  );
}

export function assertNextStatus(current: number, next: number) {
  if (!isJobStatus(current) || !isJobStatus(next)) {
    return false;
  }

  if (next === JOB_STATUS.CANCELLED) {
    return isCancellable(current);
  }

  return NEXT_JOB_STATUS[current] === next;
}
