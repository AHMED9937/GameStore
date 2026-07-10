export type AdminTableSelectionProps = {
  isSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  toggleAllVisible: () => void;
  isRowSelectable: (id: string) => boolean;
  disabled?: boolean;
};
