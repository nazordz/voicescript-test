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
  setState,
  onEdit,
  onDelete,
}: {
  state: ListState;
  setState: (next: ListState) => void;
  onEdit: (reporter: Reporter) => void;
  onDelete: (reporter: Reporter) => void;
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
      <TableToolbar state={state} setState={setState} showAvailability />
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>
                <SortButton field="name" state={state} setState={setState}>
                  Name
                </SortButton>
              </th>
              <th>
                <SortButton field="location" state={state} setState={setState}>
                  Location
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
            {data?.data.map((reporter) => (
              <tr key={reporter.id}>
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
                      onClick={() => onEdit(reporter)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      type="button"
                      onClick={() => onDelete(reporter)}
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
