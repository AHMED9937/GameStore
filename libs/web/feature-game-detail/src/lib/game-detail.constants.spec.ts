import { describe, expect, it } from 'vitest';
import { getActivationSteps, getProductDetails } from './game-detail.constants';
import { formatReleaseDate } from './game-detail.utils';
import { requirementsToDisplayRows } from '@gamestore/shared/game-requirements';

describe('game detail content', () => {
  it('includes game title in activation steps', () => {
    const steps = getActivationSteps('steam', 'Stellar Odyssey');
    const connectStep = steps.find((step) => step.step === 5);
    expect(connectStep?.description).toContain('Stellar Odyssey');
  });

  it('adapts product details to platform', () => {
    const steam = getProductDetails('steam');
    const microsoft = getProductDetails('microsoft');
    expect(steam[2]?.description).toContain('Steam');
    expect(microsoft[2]?.description).toContain('Microsoft Store');
  });

  it('formats release dates for display', () => {
    expect(formatReleaseDate('2023-08-01')).toBe('August 1, 2023');
  });

  it('formats requirement objects into label value rows', () => {
    const rows = requirementsToDisplayRows({
      requires64Bit: false,
      os: 'Windows 10',
      processor: 'Intel i5',
      memory: null,
      graphics: null,
      storage: null,
      additionalNotes: null,
    });
    expect(rows).toEqual([
      { label: 'OS', value: 'Windows 10' },
      { label: 'Processor', value: 'Intel i5' },
    ]);
  });
});
