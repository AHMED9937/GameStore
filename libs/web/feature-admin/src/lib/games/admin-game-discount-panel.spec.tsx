'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  endAdminGameDiscount,
  upsertAdminGameDiscount,
} from '@gamestore/web/data-access';
import { AdminGameDiscountPanel } from './admin-game-discount-panel';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    upsertAdminGameDiscount: vi.fn(),
    endAdminGameDiscount: vi.fn(),
  };
});

const activeDiscount = {
  percentOff: 20,
  startsAt: '2026-07-15T00:00:00.000Z',
  endsAt: '2026-07-16T00:00:00.000Z',
  showCountdown: true,
  enabled: true,
  status: 'active' as const,
  priceSale: '15.99',
  durationDays: 1,
  durationHours: 0,
};

describe('AdminGameDiscountPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders idle status and price preview', () => {
    render(
      <AdminGameDiscountPanel
        gameId="game-1"
        priceBase="19.99"
        discount={null}
      />,
    );

    expect(screen.getByTestId('admin-game-discount-panel')).toBeTruthy();
    expect(screen.getByTestId('admin-game-discount-status').textContent).toContain(
      'No promo',
    );
    expect(screen.getByTestId('admin-game-discount-preview').textContent).toContain(
      '$19.99',
    );
  });

  it('shows active status and end action for an existing promo', () => {
    render(
      <AdminGameDiscountPanel
        gameId="game-1"
        priceBase="19.99"
        discount={activeDiscount}
      />,
    );

    expect(screen.getByTestId('admin-game-discount-status').textContent).toContain(
      'Active',
    );
    expect(screen.getByTestId('admin-game-discount-end')).toBeTruthy();
  });

  it('blocks save when duration is empty', () => {
    render(
      <AdminGameDiscountPanel
        gameId="game-1"
        priceBase="19.99"
        discount={null}
      />,
    );

    fireEvent.change(screen.getByTestId('admin-game-discount-days'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('admin-game-discount-hours'), {
      target: { value: '0' },
    });

    expect(
      (screen.getByTestId('admin-game-discount-save') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('saves a promo via API', async () => {
    vi.mocked(upsertAdminGameDiscount).mockResolvedValue(activeDiscount);
    const onDiscountChange = vi.fn();

    render(
      <AdminGameDiscountPanel
        gameId="game-1"
        priceBase="19.99"
        discount={null}
        onDiscountChange={onDiscountChange}
      />,
    );

    fireEvent.click(screen.getByTestId('admin-game-discount-save'));

    await waitFor(() => {
      expect(upsertAdminGameDiscount).toHaveBeenCalledWith(
        'game-1',
        expect.objectContaining({
          percentOff: 20,
          durationDays: 1,
          enabled: true,
        }),
      );
      expect(onDiscountChange).toHaveBeenCalledWith(activeDiscount);
    });
  });

  it('ends a promo via API', async () => {
    vi.mocked(endAdminGameDiscount).mockResolvedValue({
      id: 'game-1',
      discount: null,
    });
    const onDiscountChange = vi.fn();

    render(
      <AdminGameDiscountPanel
        gameId="game-1"
        priceBase="19.99"
        discount={activeDiscount}
        onDiscountChange={onDiscountChange}
      />,
    );

    fireEvent.click(screen.getByTestId('admin-game-discount-end'));

    await waitFor(() => {
      expect(endAdminGameDiscount).toHaveBeenCalledWith('game-1');
      expect(onDiscountChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'disabled', enabled: false }),
      );
    });
  });
});
