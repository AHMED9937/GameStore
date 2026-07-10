import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminGameSearchField } from './admin-game-search-field';

vi.mock('@gamestore/web/data-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gamestore/web/data-access')>();
  return {
    ...actual,
    getAdminGames: vi.fn().mockResolvedValue([
      {
        id: 'game-1',
        title: 'Stellar Odyssey',
        slug: 'stellar-odyssey',
        platform: 'steam',
        published: true,
      },
      {
        id: 'game-2',
        title: 'Demo Game',
        slug: 'demo-game',
        platform: 'steam',
        published: false,
      },
    ]),
  };
});

describe('AdminGameSearchField', () => {
  it('filters games as the user types and selects a match', async () => {
    const onChange = vi.fn();
    render(
      <AdminGameSearchField
        value=""
        ariaLabel="Game"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Game' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'stellar' } });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Stellar Odyssey/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('option', { name: /Stellar Odyssey/i }));

    expect(onChange).toHaveBeenCalledWith('game-1');
    expect((input as HTMLInputElement).value).toBe('Stellar Odyssey');
  });

  it('supports clearing the selection with a clear option', async () => {
    const onChange = vi.fn();
    render(
      <AdminGameSearchField
        value="game-1"
        ariaLabel="Steam game"
        clearOption={{ label: 'All games' }}
        onChange={onChange}
      />,
    );

    await waitFor(() => {
      expect(
        (screen.getByRole('combobox', { name: 'Steam game' }) as HTMLInputElement).value,
      ).toBe('Stellar Odyssey');
    });

    fireEvent.focus(screen.getByRole('combobox', { name: 'Steam game' }));
    fireEvent.click(screen.getByRole('option', { name: 'All games' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
