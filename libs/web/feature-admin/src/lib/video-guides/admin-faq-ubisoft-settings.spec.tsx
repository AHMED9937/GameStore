import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getAdminFaqUbisoftSettings,
  updateAdminFaqUbisoftSettings,
} from '@gamestore/web/data-access';
import { AdminFaqUbisoftSettings } from './admin-faq-ubisoft-settings';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminFaqUbisoftSettings: vi.fn(),
    updateAdminFaqUbisoftSettings: vi.fn(),
  };
});

describe('AdminFaqUbisoftSettings', () => {
  it('renders saved FAQ links and video previews', async () => {
    vi.mocked(getAdminFaqUbisoftSettings).mockResolvedValue({
      method1VideoUrl: 'https://www.youtube.com/embed/method1',
      method2VideoUrl: 'https://www.youtube.com/embed/method2',
      lockerDownloadUrl: 'https://example.com/download',
      lockerGithubUrl: 'https://github.com/example/repo',
    });

    render(<AdminFaqUbisoftSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://www.youtube.com/embed/method1')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('https://github.com/example/repo')).toBeTruthy();
    expect(screen.getByTitle('FAQ Ubisoft method 1 preview')).toBeTruthy();
    expect(screen.getByTitle('FAQ Ubisoft method 2 preview')).toBeTruthy();
  });

  it('saves updated FAQ links', async () => {
    vi.mocked(getAdminFaqUbisoftSettings).mockResolvedValue({
      method1VideoUrl: null,
      method2VideoUrl: null,
      lockerDownloadUrl: null,
      lockerGithubUrl: null,
    });
    vi.mocked(updateAdminFaqUbisoftSettings).mockResolvedValue({
      method1VideoUrl: 'https://youtu.be/new1',
      method2VideoUrl: null,
      lockerDownloadUrl: 'https://example.com/locker',
      lockerGithubUrl: null,
    });

    render(<AdminFaqUbisoftSettings />);

    await waitFor(() => {
      expect(
        screen.getAllByPlaceholderText('https://www.youtube.com/watch?v=...').length,
      ).toBeGreaterThan(0);
    });

    const videoInputs = screen.getAllByPlaceholderText('https://www.youtube.com/watch?v=...');
    fireEvent.change(videoInputs[0], {
      target: { value: 'https://youtu.be/new1' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://example.com/locker' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save FAQ links' }));

    await waitFor(() => {
      expect(updateAdminFaqUbisoftSettings).toHaveBeenCalledWith({
        method1VideoUrl: 'https://youtu.be/new1',
        method2VideoUrl: null,
        lockerDownloadUrl: 'https://example.com/locker',
        lockerGithubUrl: null,
      });
    });
  });

  it('clears all FAQ links', async () => {
    vi.mocked(getAdminFaqUbisoftSettings).mockResolvedValue({
      method1VideoUrl: 'https://www.youtube.com/embed/method1',
      method2VideoUrl: 'https://www.youtube.com/embed/method2',
      lockerDownloadUrl: 'https://example.com/download',
      lockerGithubUrl: 'https://github.com/example/repo',
    });
    vi.mocked(updateAdminFaqUbisoftSettings).mockResolvedValue({
      method1VideoUrl: null,
      method2VideoUrl: null,
      lockerDownloadUrl: null,
      lockerGithubUrl: null,
    });

    render(<AdminFaqUbisoftSettings />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear all' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    await waitFor(() => {
      expect(updateAdminFaqUbisoftSettings).toHaveBeenCalledWith({
        method1VideoUrl: null,
        method2VideoUrl: null,
        lockerDownloadUrl: null,
        lockerGithubUrl: null,
      });
    });
  });
});
