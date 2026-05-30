"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api-client";
import {
  editorFormDefaults,
  editorFormSchema,
  type EditorFormValues,
} from "@/lib/form-schemas";
import type { Editor } from "@/lib/types";

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
  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors },
  } = useForm<EditorFormValues>({
    resolver: zodResolver(editorFormSchema),
    defaultValues: editorFormDefaults,
  });

  useEffect(() => {
    if (open) {
      reset(
        editor
          ? { name: editor.name, availability: editor.availability }
          : editorFormDefaults,
      );
    }
  }, [open, editor, reset]);

  const save = useMutation({
    mutationFn: (values: EditorFormValues) =>
      requestJson<Editor>(
        editor ? `/api/editors/${editor.id}` : "/api/editors",
        {
          method: editor ? "PATCH" : "POST",
          data: values,
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["editors"] });
      onSuccess();
      onClose();
    },
    onError: (err) =>
      setFormError("root", {
        message: err instanceof Error ? err.message : "Save failed",
      }),
  });

  return (
    <dialog className="modal" open={open}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {editor ? "Edit editor" : "New editor"}
        </h3>
        {errors.root ? (
          <div className="alert alert-error mt-3 text-sm">
            {errors.root.message}
          </div>
        ) : null}
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={handleSubmit((values) => save.mutate(values))}
          noValidate
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <input
              className={`input w-full${errors.name ? " input-error" : ""}`}
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            {errors.name ? (
              <p className="label text-error">{errors.name.message}</p>
            ) : null}
          </fieldset>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              className="toggle toggle-primary"
              type="checkbox"
              {...register("availability")}
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
