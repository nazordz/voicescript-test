"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api-client";
import { useListState } from "@/hooks/useListState";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Panel } from "@/components/ui/Panel";
import { EditorFormModal } from "@/components/editors/EditorFormModal";
import { EditorsTable } from "@/components/editors/EditorsTable";
import type { Editor } from "@/lib/types";

type FormModal = { open: boolean; editor: Editor | null };
type DeleteModal = { open: boolean; editor: Editor | null };

export default function EditorsPage() {
  const queryClient = useQueryClient();
  const [state, setState] = useListState({ sortBy: "name", sortDir: "asc" });
  const [formModal, setFormModal] = useState<FormModal>({ open: false, editor: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, editor: null });
  const [error, setError] = useState<string | null>(null);
  const [quickName, setQuickName] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const quickCreate = useMutation({
    mutationFn: () =>
      requestJson<Editor>("/api/editors", { method: "POST", data: { name: quickName } }),
    onSuccess: async () => {
      setQuickName("");
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

  const deleteEditor = useMutation({
    mutationFn: (id: string) =>
      requestJson<void>(`/api/editors/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setDeleteModal({ open: false, editor: null });
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleteModal({ open: false, editor: null });
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
            <label htmlFor="editor-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="editor-name"
              aria-label="Name"
              className="input input-bordered input-sm"
              required
              disabled={!mounted}
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
            />
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
        title="Editors"
        action={
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFormModal({ open: true, editor: null })}
          >
            Advanced
          </button>
        }
      >
        <ErrorBanner message={error} />
        <EditorsTable
          state={state}
          setState={setState}
          onEdit={(editor) => setFormModal({ open: true, editor })}
          onDelete={(editor) => setDeleteModal({ open: true, editor })}
        />
      </Panel>

      <EditorFormModal
        open={formModal.open}
        editor={formModal.editor}
        onClose={() => setFormModal({ open: false, editor: null })}
        onSuccess={() => setError(null)}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        title="Delete editor"
        description={
          deleteModal.editor
            ? `Delete "${deleteModal.editor.name}"? This cannot be undone.`
            : undefined
        }
        isPending={deleteEditor.isPending}
        onConfirm={() => {
          if (deleteModal.editor) deleteEditor.mutate(deleteModal.editor.id);
        }}
        onClose={() => setDeleteModal({ open: false, editor: null })}
      />
    </>
  );
}
