import axios, { isAxiosError, type AxiosRequestConfig } from "axios";
import type { ListState } from "@/lib/types";

export async function requestJson<T>(url: string, init?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios<T>({
      url,
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      const message = (err.response?.data as { error?: string } | undefined)?.error;
      throw new Error(message ?? "Request failed");
    }
    throw err;
  }
}

export function buildListUrl(resource: string, state: ListState, search: string) {
  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize),
    sortBy: state.sortBy,
    sortDir: state.sortDir,
  });

  if (search) params.set("search", search);
  if (state.availability) params.set("availability", state.availability);
  if (state.location) params.set("location", state.location);
  if (state.status) params.set("status", state.status);
  if (state.isRemote) params.set("isRemote", state.isRemote);

  return `/api/${resource}?${params.toString()}`;
}

export function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value).replace(/Rp\s+/, "Rp");
}
