"use client";

import { useQuery } from "@tanstack/react-query";
import { buildListUrl, requestJson } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/useListState";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { ListStateView } from "@/components/ui/ListStateView";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { SortButton } from "@/components/ui/SortButton";
import { TableToolbar } from "@/components/ui/TableToolbar";
import type { Editor, ListResponse, ListState } from "@/lib/types";

export function EditorsTable({
  state,
  setState,
  onEdit,
  onDelete,
}: {
  state: ListState;
  setState: (next: ListState) => void;
  onEdit: (editor: Editor) => void;
  onDelete: (editor: Editor) => void;
}) {
  const search = useDebouncedValue(state.search);

  const { data, isLoading } = useQuery({
    queryKey: ["editors", state, search],
    queryFn: () =>
      requestJson<ListResponse<Editor>>(buildListUrl("editors", state, search)),
  });

  return (
    <div className="rounded-box bg-base-100 p-4 shadow-sm">
      <TableToolbar state={state} setState={setState} showAvailability />
      <div className="overflow-x-auto">
        <table className="table table-sm" data-testid="editors-table">
          <thead>
            <tr>
              <th>
                <SortButton field="name" state={state} setState={setState}>
                  Name
                </SortButton>
              </th>
              <th>
                <SortButton
                  field="availability"
                  state={state}
                  setState={setState}
                >
                  Status
                </SortButton>
              </th>
              <th>Jobs</th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((editor) => (
              <tr key={editor.id} data-testid="editor-row" data-name={editor.name}>
                <td>{editor.name}</td>
                <td>
                  <AvailabilityBadge value={editor.availability} />
                </td>
                <td>{editor._count?.jobs ?? 0}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      type="button"
                      data-testid="editor-edit-button"
                      onClick={() => onEdit(editor)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      type="button"
                      data-testid="editor-delete-button"
                      onClick={() => onDelete(editor)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListStateView isLoading={isLoading} rows={data?.data.length ?? 0} />
      <PaginationControls
        pagination={data?.pagination}
        state={state}
        setStateAction={setState}
      />
    </div>
  );
}
