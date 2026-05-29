"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INDONESIAN_CITIES } from "@/lib/constants";
import { requestJson } from "@/lib/api-client";
import type { Reporter } from "@/lib/types";

type FormState = {
  name: string;
  location: string;
  availability: boolean;
};

const defaultForm: FormState = {
  name: "",
  location: "Jakarta",
  availability: true,
};

export function ReporterFormModal({
  open,
  reporter,
  onClose,
  onSuccess,
}: {
  open: boolean;
  reporter: Reporter | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        reporter
          ? { name: reporter.name, location: reporter.location, availability: reporter.availability }
          : defaultForm,
      );
    }
  }, [open, reporter]);

  const save = useMutation({
    mutationFn: () =>
      requestJson<Reporter>(
        reporter ? `/api/reporters/${reporter.id}` : "/api/reporters",
        {
          method: reporter ? "PATCH" : "POST",
          data: form,
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
      onSuccess();
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
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {reporter ? "Edit reporter" : "New reporter"}
        </h3>
        {error ? (
          <div className="alert alert-error mt-3 text-sm">{error}</div>
        ) : null}
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <input
              className="input w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Location</legend>
            <select
              className="select w-full"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              {INDONESIAN_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </fieldset>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              className="toggle toggle-primary"
              type="checkbox"
              checked={form.availability}
              onChange={(e) =>
                setForm({ ...form, availability: e.target.checked })
              }
            />
            <span className="label-text">Available</span>
          </label>
          <div className="modal-action mt-2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onClose}
            >
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
              {reporter ? "Save" : "Create"}
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
