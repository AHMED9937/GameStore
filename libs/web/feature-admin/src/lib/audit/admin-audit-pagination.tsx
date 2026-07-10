import { Button, Text } from '@gamestore/shared/ui';
import styles from './audit.module.css';

export type AdminAuditPaginationProps = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function AdminAuditPagination({
  page,
  totalPages,
  disabled = false,
  onPrevious,
  onNext,
}: AdminAuditPaginationProps) {
  const displayTotalPages = totalPages > 0 ? totalPages : 1;

  return (
    <div className={styles.pagination} data-testid="admin-audit-pagination">
      <Text tone="muted">
        Page {page} of {displayTotalPages}
      </Text>
      <div className={styles.paginationActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
