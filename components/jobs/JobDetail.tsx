"use client";

import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { JOB_STATUS, JOB_STATUS_LABELS, NEXT_JOB_STATUS } from "@/lib/constants";
import { formatIdr, requestJson } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Editor, Job, ListResponse, Reporter } from "@/lib/types";

type ActionFormValues = {
  reporterId: string;
  editorId: string;
  editorFee: number;
};

export function JobDetail({
  job,
  onEdit,
  onAction,
}: {
  job: Job | null;
  onEdit: (job: Job) => void;
  onAction: (args: {
    id: string;
    path: string;
    body?: object;
    method?: "POST" | "PATCH";
  }) => void;
}) {
  const {
    register,
    getValues,
    formState: { dirtyFields },
  } = useForm<ActionFormValues>({
    defaultValues: { reporterId: "", editorId: "", editorFee: 50000 },
  });

  const reporters = useQuery({
    queryKey: ["reporters", "options"],
    queryFn: () =>
      requestJson<ListResponse<Reporter>>(
        "/api/reporters?pageSize=100&sortBy=name",
      ),
  });

  const editors = useQuery({
    queryKey: ["editors", "options"],
    queryFn: () =>
      requestJson<ListResponse<Editor>>(
        "/api/editors?pageSize=100&sortBy=name",
      ),
  });

  if (!job) return null;

  const nextStatus = NEXT_JOB_STATUS[job.status as keyof typeof NEXT_JOB_STATUS];
  const canCancel =
    job.status !== JOB_STATUS.COMPLETED && job.status !== JOB_STATUS.CANCELLED;
  const canAssignEditor = job.status === JOB_STATUS.TRANSCRIBED;

  return (
    <div className="mt-4 rounded-box bg-base-100 p-4 shadow-sm" data-testid="job-detail">
      <div className="flex flex-col gap-3 border-b border-base-300 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold" data-testid="job-detail-title">
            {job.caseName}
          </h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <span className="badge badge-outline">{job.location}</span>
            <span className="badge badge-outline">
              {job.isRemote ? "Remote" : "Physical"}
            </span>
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          data-testid="job-edit-button"
          onClick={() => onEdit(job)}
        >
          Edit job
        </button>
      </div>
      <div className="grid gap-4 py-4 lg:grid-cols-3">
        <div className="rounded-box border border-base-300 p-3">
          <h3 className="mb-3 font-medium">Reporter</h3>
          <select
            className="select select-bordered mb-3 w-full"
            data-testid="assign-reporter-select"
            {...register("reporterId")}
          >
            <option value="">Auto assign</option>
            {reporters.data?.data
              .filter((r) => r.availability)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.location}
                </option>
              ))}
          </select>
          <button
            className="btn btn-primary btn-sm w-full"
            type="button"
            data-testid="assign-reporter-button"
            onClick={() => {
              const reporterId = getValues("reporterId");
              onAction({
                id: job.id,
                path: "assign-reporter",
                body: reporterId ? { reporterId } : {},
              });
            }}
          >
            Assign reporter
          </button>
        </div>
        <div className="rounded-box border border-base-300 p-3">
          <h3 className="mb-3 font-medium">Editor</h3>
          <select
            className={`select select-bordered mb-3 w-full${
              dirtyFields.editorId && !canAssignEditor ? " select-error" : ""
            }`}
            aria-invalid={
              dirtyFields.editorId && !canAssignEditor ? "true" : "false"
            }
            data-testid="assign-editor-select"
            {...register("editorId")}
          >
            <option value="">Auto assign</option>
            {editors.data?.data
              .filter((e) => e.availability)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
          <button
            className="btn btn-secondary btn-sm w-full"
            type="button"
            data-testid="assign-editor-button"
            disabled={!canAssignEditor}
            aria-disabled={!canAssignEditor}
            onClick={() => {
              const editorId = getValues("editorId");
              onAction({
                id: job.id,
                path: "assign-editor",
                body: editorId ? { editorId } : {},
              });
            }}
          >
            Assign editor
          </button>
          {dirtyFields.editorId && !canAssignEditor ? (
            <p className="label mt-2 text-error">
              Editor can only be assigned when the job is{" "}
              {JOB_STATUS_LABELS[JOB_STATUS.TRANSCRIBED]} (current:{" "}
              {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}).
            </p>
          ) : null}
        </div>
        <div className="rounded-box border border-base-300 p-3">
          <h3 className="mb-3 font-medium">Payment for editor</h3>
          <input
            className="input input-bordered mb-3 w-full"
            min={0}
            type="number"
            data-testid="payment-editor-fee"
            {...register("editorFee", { valueAsNumber: true })}
          />
          <button
            className="btn btn-accent btn-sm w-full"
            type="button"
            data-testid="payment-save-button"
            onClick={() =>
              onAction({
                id: job.id,
                path: "payments",
                method: "PATCH",
                body: { editorFeeIdr: getValues("editorFee") },
              })
            }
          >
            Save payment
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="stats stats-vertical w-full border border-base-300 md:stats-horizontal">
            <div className="stat">
              <div className="stat-title">Reporter</div>
              <div className="stat-value text-lg" data-testid="payment-reporter">
                {formatIdr(job.payments.reporterPayoutIdr)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Editor</div>
              <div className="stat-value text-lg" data-testid="payment-editor">
                {formatIdr(job.payments.editorPayoutIdr)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Total</div>
              <div className="stat-value text-lg" data-testid="payment-total">
                {formatIdr(job.payments.totalPayoutIdr)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {nextStatus !== undefined ? (
              <button
                className="btn btn-success"
                type="button"
                data-testid="advance-status-button"
                onClick={() =>
                  onAction({
                    id: job.id,
                    path: "status",
                    body: {
                      status: nextStatus,
                      note: `Moved to ${JOB_STATUS_LABELS[nextStatus]}.`,
                    },
                  })
                }
              >
                Move to {JOB_STATUS_LABELS[nextStatus]}
              </button>
            ) : null}
            {canCancel ? (
              <button
                className="btn btn-error btn-outline"
                type="button"
                data-testid="cancel-job-button"
                onClick={() =>
                  onAction({
                    id: job.id,
                    path: "status",
                    body: {
                      status: JOB_STATUS.CANCELLED,
                      note: `Moved to ${JOB_STATUS_LABELS[JOB_STATUS.CANCELLED]}.`,
                    },
                  })
                }
              >
                Cancel job
              </button>
            ) : null}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-medium">History</h3>
          <ul
            className="timeline timeline-vertical timeline-compact"
            data-testid="status-history"
          >
            {job.statusHistories.map((history) => (
              <li key={history.id} data-testid="status-history-item">
                <div className="timeline-start text-xs text-base-content/60">
                  {dayjs(history.createdAt).format("DD MMM HH:mm")}
                </div>
                <div className="timeline-middle">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="timeline-end mb-3">
                  <div className="text-sm font-medium">
                    {JOB_STATUS_LABELS[history.toStatus as keyof typeof JOB_STATUS_LABELS] ?? history.toStatus}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {history.note ?? "—"}
                  </div>
                </div>
                <hr />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
