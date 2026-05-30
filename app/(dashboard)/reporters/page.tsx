"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api-client";
import { useListState } from "@/hooks/useListState";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { Panel } from "@/components/ui/Panel";
import { ReporterFormModal } from "@/components/reporters/ReporterFormModal";
import { ReportersTable } from "@/components/reporters/ReportersTable";
import type { Reporter } from "@/lib/types";

type FormModal = { open: boolean; reporter: Reporter | null };
type DeleteModal = { open: boolean; reporter: Reporter | null };

export default function ReportersPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [state, setState] = useListState({ sortBy: "name", sortDir: "asc" });
  const [formModal, setFormModal] = useState<FormModal>({ open: false, reporter: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, reporter: null });
  const [error, setError] = useState<string | null>(null);

  const deleteReporter = useMutation({
    mutationFn: (id: string) =>
      requestJson<void>(`/api/reporters/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      const name = deleteModal.reporter?.name;
      setDeleteModal({ open: false, reporter: null });
      await queryClient.invalidateQueries({ queryKey: ["reporters"] });
      notify(name ? `Reporter "${name}" removed` : "Reporter removed");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleteModal({ open: false, reporter: null });
    },
  });

  return (
    <>
      <Panel
        title="Reporters"
        action={
          <button
            className="btn btn-primary btn-sm"
            type="button"
            data-testid="reporter-new-button"
            onClick={() => setFormModal({ open: true, reporter: null })}
          >
            + New reporter
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
