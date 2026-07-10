'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 300;

export type UseAdminListFiltersOptions<T extends Record<string, string>> = {
  initial: T;
  textKeys: readonly (keyof T)[];
  debounceMs?: number;
};

export function useAdminListFilters<T extends Record<string, string>>({
  initial,
  textKeys,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseAdminListFiltersOptions<T>) {
  const [draft, setDraftState] = useState<T>(initial);
  const [applied, setApplied] = useState<T>(initial);
  const textKeySet = useMemo(
    () => new Set<keyof T>(textKeys as (keyof T)[]),
    [textKeys],
  );

  const setDraft = useCallback(
    (patch: Partial<T>) => {
      setDraftState((current) => {
        const next = { ...current, ...patch };
        const immediatePatch: Partial<T> = {};
        for (const [key, value] of Object.entries(patch) as [keyof T, string][]) {
          if (!textKeySet.has(key)) {
            immediatePatch[key] = value;
          }
        }
        if (Object.keys(immediatePatch).length > 0) {
          setApplied((currentApplied) => ({ ...currentApplied, ...immediatePatch }));
        }
        return next;
      });
    },
    [textKeySet],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied((current) => {
        const textPatch: Partial<T> = {};
        let changed = false;
        for (const key of textKeys) {
          if (current[key] !== draft[key]) {
            textPatch[key] = draft[key];
            changed = true;
          }
        }
        return changed ? { ...current, ...textPatch } : current;
      });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [draft, debounceMs, textKeys]);

  const activeFilters = useMemo(() => {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(applied) as [keyof T, string][]) {
      const trimmed = value.trim();
      if (trimmed) {
        result[key] = trimmed as T[keyof T];
      }
    }
    return result;
  }, [applied]);

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return {
    draft,
    applied,
    setDraft,
    activeFilters,
    hasActiveFilters,
  };
}
