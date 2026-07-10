import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGameDiscordPanel } from './admin-game-discord-panel';

describe('AdminGameDiscordPanel', () => {
  const originalSiteUrl = process.env['NEXT_PUBLIC_SITE_URL'];

  beforeEach(() => {
    process.env['NEXT_PUBLIC_SITE_URL'] = 'https://example.com';
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env['NEXT_PUBLIC_SITE_URL'];
    } else {
      process.env['NEXT_PUBLIC_SITE_URL'] = originalSiteUrl;
    }
  });

  const preview = {
    title: 'Demo Game',
    slug: 'demo-game',
    priceBase: '9.99',
    platform: 'steam',
    soldOut: false,
    coverImage: '/cover.png',
  };

  it('shows webhook not configured status', () => {
    render(
      <AdminGameDiscordPanel
        discord={{
          configured: false,
          posted: false,
          messageId: null,
          announceDescription: null,
        }}
        announceDescription=""
        preview={preview}
        onAnnounceDescriptionChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Webhook not configured')).toBeTruthy();
    expect(screen.getByTestId('admin-game-discord-panel')).toBeTruthy();
  });

  it('shows posted status when message exists', () => {
    render(
      <AdminGameDiscordPanel
        discord={{
          configured: true,
          posted: true,
          messageId: 'msg-1',
          announceDescription: 'Hello Discord',
        }}
        announceDescription="Hello Discord"
        preview={preview}
        onAnnounceDescriptionChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Posted to Discord')).toBeTruthy();
    expect(screen.getByDisplayValue('Hello Discord')).toBeTruthy();
    expect(screen.getByTestId('admin-game-discord-preview').textContent).toContain(
      'Hello Discord',
    );
  });

  it('calls onAnnounceDescriptionChange when textarea changes', () => {
    const onAnnounceDescriptionChange = vi.fn();

    render(
      <AdminGameDiscordPanel
        discord={{
          configured: true,
          posted: false,
          messageId: null,
          announceDescription: null,
        }}
        announceDescription=""
        preview={preview}
        onAnnounceDescriptionChange={onAnnounceDescriptionChange}
      />,
    );

    fireEvent.change(screen.getByTestId('admin-game-discord-description'), {
      target: { value: 'Launch week!' },
    });

    expect(onAnnounceDescriptionChange).toHaveBeenCalledWith('Launch week!');
  });

  it('shows sold out in preview with footer', () => {
    render(
      <AdminGameDiscordPanel
        discord={{
          configured: true,
          posted: true,
          messageId: 'msg-1',
          announceDescription: null,
        }}
        announceDescription=""
        preview={{ ...preview, soldOut: true }}
        onAnnounceDescriptionChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Status: Sold out')).toBeTruthy();
    expect(screen.getByText('Currently sold out')).toBeTruthy();
  });

  it('uses default description from shared embed builder when announce text is empty', () => {
    render(
      <AdminGameDiscordPanel
        discord={{
          configured: true,
          posted: false,
          messageId: null,
          announceDescription: null,
        }}
        announceDescription=""
        preview={preview}
        onAnnounceDescriptionChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Now available on https://example.com/shop')).toBeTruthy();
    expect(screen.getByTestId('admin-game-discord-preview').textContent).toContain(
      'Now available on https://example.com/shop',
    );
  });

  it('renders cover image in preview when provided', () => {
    render(
      <AdminGameDiscordPanel
        discord={{
          configured: true,
          posted: false,
          messageId: null,
          announceDescription: null,
        }}
        announceDescription=""
        preview={preview}
        onAnnounceDescriptionChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('admin-game-discord-preview-image')).toBeTruthy();
  });
});
