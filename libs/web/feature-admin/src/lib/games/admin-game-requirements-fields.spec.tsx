import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM } from '@gamestore/shared/game-requirements';
import { AdminGameRequirementsFields } from './admin-game-requirements-fields';

describe('AdminGameRequirementsFields', () => {
  it('renders structured requirement fields and checkbox', () => {
    render(
      <AdminGameRequirementsFields
        title="Minimum requirements"
        values={EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Minimum requirements' })).toBeTruthy();
    expect(
      screen.getByLabelText('Requires a 64-bit processor and operating system'),
    ).toBeTruthy();
    expect(screen.getByText('OS')).toBeTruthy();
    expect(screen.getByText('Processor')).toBeTruthy();
    expect(screen.getByText('Memory')).toBeTruthy();
    expect(screen.getByText('Graphics')).toBeTruthy();
    expect(screen.getByText('Storage')).toBeTruthy();
  });

  it('emits updated values when checkbox changes', () => {
    const onChange = vi.fn();

    render(
      <AdminGameRequirementsFields
        title="Recommended requirements"
        values={EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByLabelText('Requires a 64-bit processor and operating system'),
    );

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM,
      requires64Bit: true,
    });
  });
});
