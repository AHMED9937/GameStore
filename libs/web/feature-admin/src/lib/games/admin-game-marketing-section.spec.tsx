import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminGameMarketingSection } from './admin-game-marketing-section';

describe('AdminGameMarketingSection', () => {
  const discordProps = {
    discord: {
      configured: true,
      posted: false,
      messageId: null,
      announceDescription: null,
    },
    announceDescription: '',
    preview: {
      title: 'Demo Game',
      slug: 'demo-game',
      priceBase: '9.99',
      platform: 'steam',
      soldOut: false,
      coverImage: '/cover.png',
    },
    onAnnounceDescriptionChange: vi.fn(),
  };

  it('renders marketing section with Discord panel by default', () => {
    render(<AdminGameMarketingSection {...discordProps} />);

    expect(screen.getByTestId('admin-game-marketing-section')).toBeTruthy();
    expect(screen.getByTestId('admin-game-discord-panel')).toBeTruthy();
    expect(
      screen.getByText(
        /Manage channel-specific announcement copy. Saving while published syncs Discord automatically./i,
      ),
    ).toBeTruthy();
  });

  it('shows Reddit platform as coming soon and disabled', () => {
    render(<AdminGameMarketingSection {...discordProps} />);

    const redditButton = screen.getByTestId('admin-game-marketing-platform-reddit');
    expect(redditButton.hasAttribute('disabled')).toBe(true);
    expect(redditButton.textContent).toContain('coming soon');
  });

  it('passes announce description changes through to Discord panel', () => {
    const onAnnounceDescriptionChange = vi.fn();

    render(
      <AdminGameMarketingSection
        {...discordProps}
        onAnnounceDescriptionChange={onAnnounceDescriptionChange}
      />,
    );

    fireEvent.change(screen.getByTestId('admin-game-discord-description'), {
      target: { value: 'Launch week!' },
    });

    expect(onAnnounceDescriptionChange).toHaveBeenCalledWith('Launch week!');
  });
});
