"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INDONESIAN_CITIES } from "@/lib/constants";
import { requestJson } from "@/lib/api-client";
import { useListState } from "@/hooks/useListState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Panel } from "@/components/ui/Panel";
import { JobDetail } from "@/components/jobs/JobDetail";
import { JobFormModal } from "@/components/jobs/JobFormModal";
import { JobsTable } from "@/components/jobs/JobsTable";
import type { Job } from "@/lib/types";

type FormModal = { open: boolean; job: Job | null };

const defaultQuickForm = { caseName: "", durationMinutes: 60, location: "Jakarta" };

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [state, setState] = useListState();
  const [formModal, setFormModal] = useState<FormModal>({ open: false, job: null });
  const [selected, setSelected] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState(defaultQuickForm);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const quickCreate = useMutation({
    mutationFn: () =>
      requestJson<Job>("/api/jobs", {
        method: "POST",
        data: { ...quickForm, durationMinutes: Number(quickForm.durationMinutes) },
      }),
    onSuccess: async (job) => {
      setSelected(job);
      setQuickForm(defaultQuickForm);
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

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
    onSuccess: async (job) => {
      setSelected(job);
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Action failed"),
  });

  function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    quickCreate.mutate();
  }

  return (
    <>
      <div className="rounded-box mb-4 bg-base-100 p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleQuickCreate}>
          <div className="flex flex-col gap-1">
            <label htmlFor="job-caseName" className="text-sm font-medium">
              Case name
            </label>
            <input
              id="job-caseName"
              aria-label="Case name"
              className="input input-bordered input-sm"
              required
              disabled={!mounted}
              value={quickForm.caseName}
              onChange={(e) => setQuickForm({ ...quickForm, caseName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="job-minutes" className="text-sm font-medium">
              Minutes
            </label>
            <input
              id="job-minutes"
              aria-label="Minutes"
              className="input input-bordered input-sm w-24"
              min={1}
              type="number"
              value={quickForm.durationMinutes}
              onChange={(e) =>
                setQuickForm({ ...quickForm, durationMinutes: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="job-location" className="text-sm font-medium">
              Location
            </label>
            <select
              id="job-location"
              aria-label="Location"
              className="select select-bordered select-sm"
              value={quickForm.location}
              onChange={(e) => setQuickForm({ ...quickForm, location: e.target.value })}
            >
              {INDONESIAN_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            type="submit"
            disabled={!mounted || quickCreate.isPending}
          >
            {quickCreate.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Create
          </button>
        </form>
      </div>

      <Panel
        title="Jobs"
        action={
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFormModal({ open: true, job: null })}
          >
            Advanced
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
