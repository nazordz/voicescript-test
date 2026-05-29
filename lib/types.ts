export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ListResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type Reporter = {
  id: string;
  name: string;
  location: string;
  availability: boolean;
  _count?: { jobs: number };
};

export type Editor = {
  id: string;
  name: string;
  availability: boolean;
  _count?: { jobs: number };
};

export type JobHistory = {
  id: string;
  fromStatus: number | null;
  toStatus: number;
  note: string | null;
  createdAt: string;
};

export type Job = {
  id: string;
  caseName: string;
  durationMinutes: number;
  location: string;
  status: number;
  statusLabel: string;
  reporterId: string | null;
  editorId: string | null;
  isRemote: boolean;
  reporterRateIdr: number;
  editorFeeIdr: number;
  createdAt: string;
  reporter: Reporter | null;
  editor: Editor | null;
  statusHistories: JobHistory[];
  payments: {
    reporterPayoutIdr: number;
    editorPayoutIdr: number;
    totalPayoutIdr: number;
  };
};

export type ListState = {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  availability: string;
  location: string;
  status: string;
  isRemote: string;
};

export const defaultListState: ListState = {
  page: 1,
  pageSize: 10,
  search: "",
  sortBy: "createdAt",
  sortDir: "desc",
  availability: "",
  location: "",
  status: "",
  isRemote: "",
};
