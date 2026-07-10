import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminGameForm } from './admin-game-form';
import { EMPTY_ADMIN_GAME_FORM_VALUES } from './admin-games.types';

describe('AdminGameForm SEO fields', () => {
  it('renders SEO fields on the Storefront tab', () => {
    render(
      <AdminGameForm
        values={{
          ...EMPTY_ADMIN_GAME_FORM_VALUES,
          metaTitle: 'Custom meta title',
          metaDescription: 'Custom meta description',
          ogImage: 'https://cdn.example.com/og.png',
        }}
        activeTab="storefront"
      />,
    );

    expect(screen.getByDisplayValue('Custom meta title')).toBeTruthy();
    expect(screen.getByDisplayValue('Custom meta description')).toBeTruthy();
    expect(screen.getByDisplayValue('https://cdn.example.com/og.png')).toBeTruthy();
    expect(screen.getByText(/Leave blank to use auto-generated defaults/i)).toBeTruthy();
  });

  it('updates metaTitle through onValuesChange', () => {
    let latest = { ...EMPTY_ADMIN_GAME_FORM_VALUES };

    const { container } = render(
      <AdminGameForm
        values={latest}
        activeTab="storefront"
        onValuesChange={(values) => {
          latest = values;
        }}
      />,
    );

    const metaTitleInput = container.querySelector(
      'input[name="metaTitle"]',
    ) as HTMLInputElement;
    fireEvent.change(metaTitleInput, {
      target: { value: 'Updated SEO title' },
    });

    expect(latest.metaTitle).toBe('Updated SEO title');
  });

  it('renders marketing section on the Marketing tab', () => {
    render(
      <AdminGameForm
        values={EMPTY_ADMIN_GAME_FORM_VALUES}
        activeTab="marketing"
        marketingSection={
          <div data-testid="marketing-section-placeholder">Marketing content</div>
        }
      />,
    );

    expect(screen.getByTestId('marketing-section-placeholder')).toBeTruthy();
  });
});
