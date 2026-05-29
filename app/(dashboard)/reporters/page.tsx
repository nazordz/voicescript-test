"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INDONESIAN_CITIES } from "@/lib/constants";
import { requestJson } from "@/lib/api-client";
import { useListState } from "@/hooks/useListState";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Panel } from "@/components/ui/Panel";
import { ReporterFormModal } from "@/components/reporters/ReporterFormModal";
import { ReportersTable } from "@/components/reporters/ReportersTable";
import type { Reporter } from "@/lib/types";

type FormModal = { open: boolean; reporter: Reporter | null };
type DeleteModal = { open: boolean; reporter: Reporter | null };

const defaultQuickForm = { name: "", location: "Jakarta" };

export default function ReportersPage() {
  const queryClient = useQueryClient();
  const [state, setState] = useListState({ sortBy: "name", sortDir: "asc" });
  const [formModal, setFormModal] = useState<FormModal>({ open: false, reporter: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, reporter: null });
  const [error, setError] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState(defaultQuickForm);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const quickCreate = useMutation({
    mutationFn: () =>
      requestJson<Reporter>("/api/reporters", { method: "POST", data: quickForm }),
    onSuccess: async () => {
      setQuickForm(defaultQuickForm);
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

  const deleteReporter = useMutation({
    mutationFn: (id: string) =>
      requestJson<void>(`/api/reporters/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setDeleteModal({ open: false, reporter: null });
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleteModal({ open: false, reporter: null });
    },
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
            <label htmlFor="reporter-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="reporter-name"
              aria-label="Name"
              className="input input-bordered input-sm"
              required
              disabled={!mounted}
              value={quickForm.name}
              onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="reporter-location" className="text-sm font-medium">
              Location
            </label>
            <select
              id="reporter-location"
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
        title="Reporters"
        action={
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFormModal({ open: true, reporter: null })}
          >
            Advanced
          </button>
        }
      >
        <ErrorBanner message={error} />
        <ReportersTable
          state={state}
          setState={setState}
          onEdit={(reporter) => setFormModal({ open: true, reporter })}
          onDelete={(reporter) => setDeleteModal({ open: true, reporter })}
        />
      </Panel>

      <ReporterFormModal
        open={formModal.open}
        reporter={formModal.reporter}
        onClose={() => setFormModal({ open: false, reporter: null })}
        onSuccess={() => setError(null)}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        title="Delete reporter"
        description={
          deleteModal.reporter
            ? `Delete "${deleteModal.reporter.name}"? This cannot be undone.`
            : undefined
        }
        isPending={deleteReporter.isPending}
        onConfirm={() => {
          if (deleteModal.reporter) deleteReporter.mutate(deleteModal.reporter.id);
        }}
        onClose={() => setDeleteModal({ open: false, reporter: null })}
      />
    </>
  );
}
