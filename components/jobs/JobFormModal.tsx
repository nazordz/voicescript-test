"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INDONESIAN_CITIES } from "@/lib/constants";
import { DEFAULT_REPORTER_RATE_IDR, DEFAULT_EDITOR_FEE_IDR } from "@/lib/constants";
import { requestJson } from "@/lib/api-client";
import type { Job } from "@/lib/types";

type FormState = {
  caseName: string;
  durationMinutes: number;
  location: string;
  isRemote: boolean;
  reporterRateIdr: number;
  editorFeeIdr: number;
};

const defaultForm: FormState = {
  caseName: "",
  durationMinutes: 60,
  location: "Jakarta",
  isRemote: false,
  reporterRateIdr: DEFAULT_REPORTER_RATE_IDR,
  editorFeeIdr: DEFAULT_EDITOR_FEE_IDR,
};

export function JobFormModal({
  open,
  job,
  onClose,
  onSuccess,
}: {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onSuccess: (saved: Job) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        job
          ? {
              caseName: job.caseName,
              durationMinutes: job.durationMinutes,
              location: job.location,
              isRemote: job.isRemote,
              reporterRateIdr: job.reporterRateIdr,
              editorFeeIdr: job.editorFeeIdr,
            }
          : defaultForm,
      );
    }
  }, [open, job]);

  const save = useMutation({
    mutationFn: () =>
      requestJson<Job>(job ? `/api/jobs/${job.id}` : "/api/jobs", {
        method: job ? "PATCH" : "POST",
        data: {
          ...form,
          durationMinutes: Number(form.durationMinutes),
          reporterRateIdr: Number(form.reporterRateIdr),
          editorFeeIdr: Number(form.editorFeeIdr),
        },
      }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onSuccess(saved);
      onClose();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Save failed"),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    save.mutate();
  }

  return (
    <dialog className="modal" open={open}>
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">{job ? "Edit job" : "New job"}</h3>
        {error ? (
          <div className="alert alert-error mt-3 text-sm">{error}</div>
        ) : null}
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Case name</legend>
            <input
              className="input w-full"
              required
              value={form.caseName}
              onChange={(e) => setForm({ ...form, caseName: e.target.value })}
            />
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Minutes</legend>
              <input
                className="input w-full"
                min={1}
                type="number"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: Number(e.target.value) })
                }
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Location</legend>
              <select
                className="select w-full"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              >
                {INDONESIAN_CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </fieldset>
          </div>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              className="toggle toggle-primary"
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
            />
            <span className="label-text">Remote</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Reporter rate (IDR)</legend>
              <input
                className="input w-full"
                min={0}
                type="number"
                value={form.reporterRateIdr}
                onChange={(e) =>
                  setForm({ ...form, reporterRateIdr: Number(e.target.value) })
                }
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Editor fee (IDR)</legend>
              <input
                className="input w-full"
                min={0}
                type="number"
                value={form.editorFeeIdr}
                onChange={(e) =>
                  setForm({ ...form, editorFeeIdr: Number(e.target.value) })
                }
              />
            </fieldset>
          </div>
          <div className="modal-action mt-2">
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={save.isPending}
            >
              {save.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              {job ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
