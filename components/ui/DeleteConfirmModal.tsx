"use client";

export function DeleteConfirmModal({
  open,
  title,
  description,
  isPending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <dialog className="modal" open={open}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? (
          <p className="py-4 text-sm text-base-content/70">{description}</p>
        ) : null}
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            type="button"
            data-testid="delete-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-error"
            type="button"
            data-testid="delete-confirm-button"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <span className="loading loading-spinner loading-sm" /> : null}
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
