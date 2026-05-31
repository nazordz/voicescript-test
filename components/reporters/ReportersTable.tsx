"use client";

import { useQuery } from "@tanstack/react-query";
import { buildListUrl, requestJson } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/useListState";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { ListStateView } from "@/components/ui/ListStateView";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { SortButton } from "@/components/ui/SortButton";
import { TableToolbar } from "@/components/ui/TableToolbar";
import type { ListResponse, ListState, Reporter } from "@/lib/types";

export function ReportersTable({
  state,
  setStateAction,
  onEditAction,
  onDeleteAction,
}: {
  state: ListState;
  setStateAction: (next: ListState) => void;
  onEditAction: (reporter: Reporter) => void;
  onDeleteAction: (reporter: Reporter) => void;
}) {
  const search = useDebouncedValue(state.search);

  const { data, isLoading } = useQuery({
    queryKey: ["reporters", state, search],
    queryFn: () =>
      requestJson<ListResponse<Reporter>>(
        buildListUrl("reporters", state, search),
      ),
  });

  return (
    <div className="rounded-box bg-base-100 p-4 shadow-sm">
      <TableToolbar state={state} setStateAction={setStateAction} showAvailability />
      <div className="overflow-x-auto">
        <table className="table table-sm" data-testid="reporters-table">
          <thead>
            <tr>
              <th>
                <SortButton field="name" state={state} setStateAction={setStateAction}>
                  Name
                </SortButton>
              </th>
              <th>
                <SortButton field="location" state={state} setStateAction={setStateAction}>
                  Location
                </SortButton>
              </th>
              <th>
                <SortButton
                  field="availability"
                  state={state}
                  setStateAction={setStateAction}
                >
                  Status
                </SortButton>
              </th>
              <th>Jobs</th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((reporter) => (
              <tr key={reporter.id} data-testid="reporter-row" data-name={reporter.name}>
                <td>{reporter.name}</td>
                <td>{reporter.location}</td>
                <td>
                  <AvailabilityBadge value={reporter.availability} />
                </td>
                <td>{reporter._count?.jobs ?? 0}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      type="button"
                      data-testid="reporter-edit-button"
                      onClick={() => onEditAction(reporter)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      type="button"
                      data-testid="reporter-delete-button"
                      onClick={() => onDeleteAction(reporter)}
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
        setStateAction={setStateAction}
      />
    </div>
  );
}
