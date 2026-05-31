"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INDONESIAN_CITIES } from "@/lib/constants";
import { requestJson } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import {
  jobFormDefaults,
  jobFormSchema,
  type JobFormValues,
} from "@/lib/form-schemas";
import type { Job } from "@/lib/types";

export function JobFormModal({
  open,
  job,
  onCloseAction,
  onSuccessAction,
}: {
  open: boolean;
  job: Job | null;
  onCloseAction: () => void;
  onSuccessAction: (saved: Job) => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults,
  });

  useEffect(() => {
    if (open) {
      reset(
        job
          ? {
              caseName: job.caseName,
              durationMinutes: job.durationMinutes,
              location: job.location,
              isRemote: job.isRemote,
              reporterRateIdr: job.reporterRateIdr,
              editorFeeIdr: job.editorFeeIdr,
            }
          : jobFormDefaults,
      );
    }
  }, [open, job, reset]);

  const save = useMutation({
    mutationFn: (values: JobFormValues) =>
      requestJson<Job>(job ? `/api/jobs/${job.id}` : "/api/jobs", {
        method: job ? "PATCH" : "POST",
        data: values,
      }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      notify(job ? `Job "${saved.caseName}" updated` : `Job "${saved.caseName}" created`);
      onSuccessAction(saved);
      onCloseAction();
    },
    onError: (err) =>
      setFormError("root", {
        message: err instanceof Error ? err.message : "Save failed",
      }),
  });

  return (
    <dialog className="modal" open={open} data-testid="job-form-modal">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">{job ? "Edit job" : "New job"}</h3>
        {errors.root ? (
          <div className="alert alert-error mt-3 text-sm" data-testid="job-form-error">
            {errors.root.message}
          </div>
        ) : null}
        <form
          className="mt-4 flex flex-col gap-3"
          data-testid="job-form"
          onSubmit={handleSubmit((values) => save.mutate(values))}
          noValidate
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Case name</legend>
            <input
              className={`input w-full${errors.caseName ? " input-error" : ""}`}
              aria-invalid={errors.caseName ? "true" : "false"}
              data-testid="job-form-case-name"
              {...register("caseName")}
            />
            {errors.caseName ? (
              <p className="label text-error" data-testid="job-form-case-name-error">
                {errors.caseName.message}
              </p>
            ) : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Minutes</legend>
              <input
                className={`input w-full${errors.durationMinutes ? " input-error" : ""}`}
                aria-invalid={errors.durationMinutes ? "true" : "false"}
                min={1}
                type="number"
                data-testid="job-form-duration"
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              {errors.durationMinutes ? (
                <p className="label text-error">
                  {errors.durationMinutes.message}
                </p>
              ) : null}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Location</legend>
              <select
                className={`select w-full${errors.location ? " select-error" : ""}`}
                aria-invalid={errors.location ? "true" : "false"}
                data-testid="job-form-location"
                {...register("location")}
              >
                {INDONESIAN_CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
              {errors.location ? (
                <p className="label text-error">{errors.location.message}</p>
              ) : null}
            </fieldset>
          </div>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              className="toggle toggle-primary"
              type="checkbox"
              data-testid="job-form-remote"
              {...register("isRemote")}
            />
            <span className="label-text">Remote</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Reporter rate (IDR)</legend>
              <input
                className={`input w-full${errors.reporterRateIdr ? " input-error" : ""}`}
                aria-invalid={errors.reporterRateIdr ? "true" : "false"}
                min={0}
                type="number"
                data-testid="job-form-reporter-rate"
                {...register("reporterRateIdr", { valueAsNumber: true })}
              />
              {errors.reporterRateIdr ? (
                <p className="label text-error">
                  {errors.reporterRateIdr.message}
                </p>
              ) : null}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Editor fee (IDR)</legend>
              <input
                className={`input w-full${errors.editorFeeIdr ? " input-error" : ""}`}
                aria-invalid={errors.editorFeeIdr ? "true" : "false"}
                min={0}
                type="number"
                data-testid="job-form-editor-fee"
                {...register("editorFeeIdr", { valueAsNumber: true })}
              />
              {errors.editorFeeIdr ? (
                <p className="label text-error">
                  {errors.editorFeeIdr.message}
                </p>
              ) : null}
            </fieldset>
          </div>
          <div className="modal-action mt-2">
            <button
              className="btn btn-ghost"
              type="button"
              data-testid="job-form-cancel"
              onClick={onCloseAction}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              data-testid="job-form-submit"
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
        <button type="submit" onClick={onCloseAction}>
          close
        </button>
      </form>
    </dialog>
  );
}
