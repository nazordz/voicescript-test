"use client";

import { useEffect, useState } from "react";
import { defaultListState, type ListState } from "@/lib/types";

export { defaultListState };
export type { ListState };

export function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

export function useListState(initial?: Partial<ListState>) {
  return useState<ListState>({ ...defaultListState, ...initial });
}
