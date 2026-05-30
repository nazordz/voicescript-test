"use client";

import { INDONESIAN_CITIES, JOB_STATUS_LABELS } from "@/lib/constants";
import type { ListState } from "@/lib/types";

export function TableToolbar({
  state,
  setState,
  showAvailability,
  showLocation,
  showStatus,
  showRemote,
}: {
  state: ListState;
  setState: (next: ListState) => void;
  showAvailability?: boolean;
  showLocation?: boolean;
  showStatus?: boolean;
  showRemote?: boolean;
}) {
  return (
    <div className="mb-3 grid gap-2 md:grid-cols-4">
      <input
        className="input input-bordered input-sm"
        placeholder="Search"
        data-testid="search-input"
        value={state.search}
        onChange={(event) =>
          setState({ ...state, page: 1, search: event.target.value })
        }
      />
      {showAvailability ? (
        <select
          className="select select-bordered select-sm"
          data-testid="filter-availability"
          value={state.availability}
          onChange={(event) =>
            setState({ ...state, page: 1, availability: event.target.value })
          }
        >
          <option value="">All availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      ) : null}
      {showLocation ? (
        <select
          className="select select-bordered select-sm"
          data-testid="filter-location"
          value={state.location}
          onChange={(event) =>
            setState({ ...state, page: 1, location: event.target.value })
          }
        >
          <option value="">All locations</option>
          {INDONESIAN_CITIES.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
      ) : null}
      {showStatus ? (
        <select
          className="select select-bordered select-sm"
          data-testid="filter-status"
          value={state.status}
          onChange={(event) =>
            setState({ ...state, page: 1, status: event.target.value })
          }
        >
          <option value="">All statuses</option>
          {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ) : null}
      {showRemote ? (
        <select
          className="select select-bordered select-sm"
          data-testid="filter-remote"
          value={state.isRemote}
          onChange={(event) =>
            setState({ ...state, page: 1, isRemote: event.target.value })
          }
        >
          <option value="">All modes</option>
          <option value="false">Physical</option>
          <option value="true">Remote</option>
        </select>
      ) : null}
    </div>
  );
}
