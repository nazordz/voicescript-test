"use client";

import type { ListState, Pagination } from "@/lib/types";

export function PaginationControls({
  pagination,
  state,
  setState,
}: {
  pagination?: Pagination;
  state: ListState;
  setState: (next: ListState) => void;
}) {
  const page = pagination?.page ?? state.page;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-3 border-t border-base-300 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-base-content/70">
        Page {page} of {totalPages} · {pagination?.totalItems ?? 0} rows
      </div>
      <div className="join">
        <button
          className="btn join-item btn-sm"
          disabled={page <= 1}
          type="button"
          onClick={() => setState({ ...state, page: page - 1 })}
        >
          Prev
        </button>
        <select
          className="select join-item select-sm w-20"
          value={state.pageSize}
          onChange={(event) =>
            setState({ ...state, page: 1, pageSize: Number(event.target.value) })
          }
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button
          className="btn join-item btn-sm"
          disabled={page >= totalPages}
          type="button"
          onClick={() => setState({ ...state, page: page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
