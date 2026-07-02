import { describe, expect, it } from 'vitest';
import { getActivationSteps, getProductDetails } from './game-detail.constants';
import { formatReleaseDate, parseRequirements } from './game-detail.utils';

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

  it('parses requirement lines into label value rows', () => {
    const rows = parseRequirements('OS: Windows 10\nProcessor: Intel i5');
    expect(rows).toEqual([
      { label: 'OS', value: 'Windows 10' },
      { label: 'Processor', value: 'Intel i5' },
    ]);
  });
});
