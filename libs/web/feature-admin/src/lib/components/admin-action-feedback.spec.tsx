import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminActionFeedback } from './admin-action-feedback';

describe('AdminActionFeedback', () => {
  it('renders error banner when error exists', () => {
    render(<AdminActionFeedback error="Operation failed" testIdPrefix="admin-test" />);

    expect(screen.getByTestId('admin-test-error').textContent).toContain(
      'Operation failed',
    );
  });

  it('renders pending banner instead of success message while pending', () => {
    render(
      <AdminActionFeedback
        message="Operation completed"
        isPending
        pendingMessage="Applying updates…"
        testIdPrefix="admin-test"
      />,
    );

    expect(screen.getByTestId('admin-test-pending')).toBeTruthy();
    expect(screen.queryByTestId('admin-test-message')).toBeNull();
  });

  it('renders success message when not pending and no error', () => {
    render(<AdminActionFeedback message="Done" testIdPrefix="admin-test" />);

    expect(screen.getByTestId('admin-test-message').textContent).toContain('Done');
  });
});
