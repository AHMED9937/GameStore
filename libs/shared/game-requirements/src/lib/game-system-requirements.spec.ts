import { describe, expect, it } from 'vitest';
import {
  EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM,
  fromRequirementsFormValues,
  hasGameSystemRequirementsContent,
  parseLegacyRequirementsText,
  parseStoredGameSystemRequirements,
  requirementsToDisplayRows,
  serializeGameSystemRequirements,
  toRequirementsFormValues,
} from './game-system-requirements';

const LEGACY_MIN = `Requires a 64-bit processor and operating system
OS: Windows 10/11 64-bit
Processor: Intel Core i5-8400 / AMD Ryzen 5 2600
Memory: 8 GB RAM
Graphics: NVIDIA GTX 1060 / AMD RX 580
Storage: 45 GB available space`;

describe('game-system-requirements', () => {
  it('parses legacy multiline requirements text', () => {
    const parsed = parseLegacyRequirementsText(LEGACY_MIN);

    expect(parsed).toEqual({
      requires64Bit: true,
      os: 'Windows 10/11 64-bit',
      processor: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 1060 / AMD RX 580',
      storage: '45 GB available space',
      additionalNotes: null,
    });
  });

  it('serializes structured requirements as JSON', () => {
    const serialized = serializeGameSystemRequirements({
      requires64Bit: true,
      os: 'Windows 11',
      processor: 'Intel Core i7',
      memory: '16 GB RAM',
      graphics: 'RTX 3060',
      storage: '50 GB',
      additionalNotes: null,
    });

    expect(serialized).toBe(
      JSON.stringify({
        requires64Bit: true,
        os: 'Windows 11',
        processor: 'Intel Core i7',
        memory: '16 GB RAM',
        graphics: 'RTX 3060',
        storage: '50 GB',
        additionalNotes: null,
      }),
    );
  });

  it('round-trips stored JSON requirements', () => {
    const original = {
      requires64Bit: false,
      os: 'Windows 10',
      processor: 'Quad core',
      memory: '8 GB RAM',
      graphics: 'GTX 1050',
      storage: '20 GB',
      additionalNotes: 'SSD recommended',
    };
    const stored = serializeGameSystemRequirements(original);

    expect(parseStoredGameSystemRequirements(stored)).toEqual(original);
  });

  it('falls back to legacy parsing for non-JSON stored text', () => {
    expect(parseStoredGameSystemRequirements(LEGACY_MIN)?.os).toBe(
      'Windows 10/11 64-bit',
    );
  });

  it('converts empty form values to null', () => {
    expect(fromRequirementsFormValues(EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM)).toBeNull();
  });

  it('builds display rows with 64-bit note first', () => {
    const rows = requirementsToDisplayRows(
      parseLegacyRequirementsText(LEGACY_MIN),
    );

    expect(rows[0]).toEqual({
      label: 'Note',
      value: 'Requires a 64-bit processor and operating system',
    });
    expect(rows).toContainEqual({
      label: 'Processor',
      value: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
    });
  });

  it('maps API objects back to form values', () => {
    const form = toRequirementsFormValues({
      requires64Bit: true,
      os: 'Windows 11',
      processor: null,
      memory: '16 GB RAM',
      graphics: null,
      storage: null,
      additionalNotes: null,
    });

    expect(form.requires64Bit).toBe(true);
    expect(form.os).toBe('Windows 11');
    expect(form.memory).toBe('16 GB RAM');
    expect(form.processor).toBe('');
  });

  it('detects whether requirements have any content', () => {
    expect(
      hasGameSystemRequirementsContent({
        requires64Bit: false,
        os: null,
        processor: null,
        memory: null,
        graphics: null,
        storage: null,
        additionalNotes: null,
      }),
    ).toBe(false);
    expect(
      hasGameSystemRequirementsContent({
        requires64Bit: true,
        os: null,
        processor: null,
        memory: null,
        graphics: null,
        storage: null,
        additionalNotes: null,
      }),
    ).toBe(true);
  });
});
