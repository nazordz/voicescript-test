"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api-client";
import type { Editor } from "@/lib/types";

type FormState = {
  name: string;
  availability: boolean;
};

const defaultForm: FormState = { name: "", availability: true };

export function EditorFormModal({
  open,
  editor,
  onClose,
  onSuccess,
}: {
  open: boolean;
  editor: Editor | null;
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
        editor
          ? { name: editor.name, availability: editor.availability }
          : defaultForm,
      );
    }
  }, [open, editor]);

  const save = useMutation({
    mutationFn: () =>
      requestJson<Editor>(
        editor ? `/api/editors/${editor.id}` : "/api/editors",
        {
          method: editor ? "PATCH" : "POST",
          data: form,
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
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
          {editor ? "Edit editor" : "New editor"}
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
              {editor ? "Save" : "Create"}
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
