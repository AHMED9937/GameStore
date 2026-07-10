import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminVideoGuidesPage } from './admin-video-guides-page';

vi.mock('./admin-activation-video-settings', () => ({
  AdminActivationVideoSettings: () => (
    <div data-testid="admin-activation-video-settings" />
  ),
}));

vi.mock('./admin-faq-ubisoft-settings', () => ({
  AdminFaqUbisoftSettings: () => <div data-testid="admin-faq-ubisoft-settings" />,
}));

describe('AdminVideoGuidesPage', () => {
  it('renders page heading and both settings sections', () => {
    render(<AdminVideoGuidesPage />);

    expect(screen.getByRole('heading', { name: 'Video guides' })).toBeTruthy();
    expect(
      screen.getByText(
        'Manage store-wide activation videos and FAQ guide links shown to customers.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('admin-activation-video-settings')).toBeTruthy();
    expect(screen.getByTestId('admin-faq-ubisoft-settings')).toBeTruthy();
  });
});
