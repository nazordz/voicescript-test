"use client";

import type { ListState } from "@/lib/types";

export function SortButton({
  field,
  state,
  setStateAction,
  children,
}: {
  field: string;
  state: ListState;
  setStateAction: (next: ListState) => void;
  children: React.ReactNode;
}) {
  const active = state.sortBy === field;
  const nextDir = active && state.sortDir === "asc" ? "desc" : "asc";

  return (
    <button
      className="btn btn-ghost btn-xs px-1"
      type="button"
      data-testid={`sort-${field}`}
      onClick={() =>
        setStateAction({ ...state, page: 1, sortBy: field, sortDir: nextDir })
      }
    >
      {children} {active ? (state.sortDir === "asc" ? "↑" : "↓") : ""}
    </button>
  );
}
