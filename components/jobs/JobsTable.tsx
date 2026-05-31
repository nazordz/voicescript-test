"use client";

import { useQuery } from "@tanstack/react-query";
import { buildListUrl, formatIdr, requestJson } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/useListState";
import { ListStateView } from "@/components/ui/ListStateView";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { SortButton } from "@/components/ui/SortButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableToolbar } from "@/components/ui/TableToolbar";
import type { Job, ListResponse, ListState } from "@/lib/types";

export function JobsTable({
  state,
  setStateAction,
  onSelectAction,
}: {
  state: ListState;
  setStateAction: (next: ListState) => void;
  onSelectAction: (job: Job) => void;
}) {
  const search = useDebouncedValue(state.search);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", state, search],
    queryFn: () =>
      requestJson<ListResponse<Job>>(buildListUrl("jobs", state, search)),
  });

  return (
    <div className="rounded-box bg-base-100 p-4 shadow-sm">
      <TableToolbar
        state={state}
        setStateAction={setStateAction}
        showLocation
        showStatus
        showRemote
      />
      <div className="overflow-x-auto">
        <table className="table table-sm" data-testid="jobs-table">
          <thead>
            <tr>
              <th>
                <SortButton field="caseName" state={state} setStateAction={setStateAction}>
                  Case
                </SortButton>
              </th>
              <th>
                <SortButton field="status" state={state} setStateAction={setStateAction}>
                  Status
                </SortButton>
              </th>
              <th>
                <SortButton field="location" state={state} setStateAction={setStateAction}>
                  Location
                </SortButton>
              </th>
              <th>Remote</th>
              <th>Reporter</th>
              <th>Editor</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((job) => (
              <tr
                className="cursor-pointer hover"
                key={job.id}
                data-testid="job-row"
                data-case-name={job.caseName}
                onClick={() => onSelectAction(job)}
              >
                <td>
                  <div className="font-medium">{job.caseName}</div>
                  <div className="text-xs text-base-content/60">
                    {job.durationMinutes} min ·{" "}
                    {job.isRemote ? "Remote" : "Physical"}
                  </div>
                </td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>{job.location}</td>
                <td>
                  {job.isRemote ? (
                    <span className="badge badge-info badge-sm">Remote</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{job.reporter?.name ?? "—"}</td>
                <td>{job.editor?.name ?? "—"}</td>
                <td>{formatIdr(job.payments.totalPayoutIdr)}</td>
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
