'use client';

import { useCallback, useMemo, useState } from 'react';

export type UseAdminRowSelectionOptions = {
  rowIds: string[];
  isRowSelectable?: (id: string) => boolean;
};

export function useAdminRowSelection({
  rowIds,
  isRowSelectable = () => true,
}: UseAdminRowSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectableIds = useMemo(
    () => rowIds.filter((id) => isRowSelectable(id)),
    [rowIds, isRowSelectable],
  );

  const selectedCount = selectedIds.length;

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds],
  );

  const toggleRow = useCallback(
    (id: string) => {
      if (!isRowSelectable(id)) {
        return;
      }
      setSelectedIds((current) =>
        current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      );
    },
    [isRowSelectable],
  );

  const toggleAllVisible = useCallback(() => {
    const allSelected =
      selectableIds.length > 0 &&
      selectableIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !selectableIds.includes(id)),
      );
      return;
    }

    setSelectedIds((current) => [
      ...current.filter((id) => !selectableIds.includes(id)),
      ...selectableIds,
    ]);
  }, [selectableIds, selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const allVisibleSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  const someVisibleSelected =
    selectableIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;

  return {
    selectedIds,
    selectedCount,
    isSelected,
    toggleRow,
    toggleAllVisible,
    clearSelection,
    allVisibleSelected,
    someVisibleSelected,
    isRowSelectable,
  };
}
