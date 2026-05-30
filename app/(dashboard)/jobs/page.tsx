"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api-client";
import { useListState } from "@/hooks/useListState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { Panel } from "@/components/ui/Panel";
import { JobDetail } from "@/components/jobs/JobDetail";
import { JobFormModal } from "@/components/jobs/JobFormModal";
import { JobsTable } from "@/components/jobs/JobsTable";
import type { Job } from "@/lib/types";

type FormModal = { open: boolean; job: Job | null };

const JOB_ACTION_LABELS: Record<string, string> = {
  status: "status updated",
  "assign-reporter": "reporter assigned",
  "assign-editor": "editor assigned",
  payments: "payment updated",
};

export default function JobsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [state, setState] = useListState();
  const [formModal, setFormModal] = useState<FormModal>({ open: false, job: null });
  const [selected, setSelected] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobAction = useMutation({
    mutationFn: ({
      id,
      path,
      body,
      method = "POST",
    }: {
      id: string;
      path: string;
      body?: object;
      method?: "POST" | "PATCH";
    }) =>
      requestJson<Job>(`/api/jobs/${id}/${path}`, {
        method,
        data: body ?? {},
      }),
    onSuccess: async (job, variables) => {
      setSelected(job);
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
      notify(`Job "${job.caseName}" ${JOB_ACTION_LABELS[variables.path] ?? "updated"}`);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Action failed"),
  });

  return (
    <>
      <Panel
        title="Jobs"
        action={
          <button
            className="btn btn-primary btn-sm"
            type="button"
            data-testid="job-new-button"
            onClick={() => setFormModal({ open: true, job: null })}
          >
            + New job
          </button>
        }
      >
        <ErrorBanner message={error} />
        <JobsTable
          state={state}
          setState={setState}
          onSelect={(job) => setSelected(job)}
        />
      </Panel>

      <JobDetail
        key={selected?.id ?? "empty"}
        job={selected}
        onEdit={(job) => setFormModal({ open: true, job })}
        onAction={(args) => {
          setError(null);
          jobAction.mutate(args);
        }}
      />

      <JobFormModal
        open={formModal.open}
        job={formModal.job}
        onClose={() => setFormModal({ open: false, job: null })}
        onSuccess={(saved) => {
          setSelected(saved);
          setError(null);
        }}
      />
    </>
  );
}
