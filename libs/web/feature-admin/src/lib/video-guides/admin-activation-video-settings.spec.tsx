import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getDefaultActivationVideo,
  updateDefaultActivationVideo,
} from '@gamestore/web/data-access';
import { AdminActivationVideoSettings } from './admin-activation-video-settings';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getDefaultActivationVideo: vi.fn(),
    updateDefaultActivationVideo: vi.fn(),
  };
});

describe('AdminActivationVideoSettings', () => {
  it('renders saved URL and preview', async () => {
    vi.mocked(getDefaultActivationVideo).mockResolvedValue({
      url: 'https://www.youtube.com/embed/saved123',
    });

    render(<AdminActivationVideoSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://www.youtube.com/embed/saved123')).toBeTruthy();
    });
    expect(screen.getByTitle('Default activation video preview')).toBeTruthy();
  });

  it('saves updated URL', async () => {
    vi.mocked(getDefaultActivationVideo).mockResolvedValue({ url: null });
    vi.mocked(updateDefaultActivationVideo).mockResolvedValue({
      url: 'https://www.youtube.com/embed/newvideo',
    });

    render(<AdminActivationVideoSettings />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://www.youtube.com/embed/...')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('https://www.youtube.com/embed/...'), {
      target: { value: 'https://youtu.be/newvideo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save default' }));

    await waitFor(() => {
      expect(updateDefaultActivationVideo).toHaveBeenCalledWith('https://youtu.be/newvideo');
    });
  });

  it('clears the default URL', async () => {
    vi.mocked(getDefaultActivationVideo).mockResolvedValue({
      url: 'https://www.youtube.com/embed/saved123',
    });
    vi.mocked(updateDefaultActivationVideo).mockResolvedValue({ url: null });

    render(<AdminActivationVideoSettings />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear default' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear default' }));

    await waitFor(() => {
      expect(updateDefaultActivationVideo).toHaveBeenCalledWith(null);
    });
  });
});
