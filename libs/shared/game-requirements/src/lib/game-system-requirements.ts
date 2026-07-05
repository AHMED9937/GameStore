export type GameSystemRequirements = {
  requires64Bit: boolean;
  os: string | null;
  processor: string | null;
  memory: string | null;
  graphics: string | null;
  storage: string | null;
  additionalNotes: string | null;
};

export type GameSystemRequirementsFormValues = {
  requires64Bit: boolean;
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
  additionalNotes: string;
};

export type GameSystemRequirementsRow = {
  label: string;
  value: string;
};

export const EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM: GameSystemRequirementsFormValues =
  {
    requires64Bit: false,
    os: '',
    processor: '',
    memory: '',
    graphics: '',
    storage: '',
    additionalNotes: '',
  };

const FIELD_LABELS: Record<
  keyof Omit<GameSystemRequirements, 'requires64Bit'>,
  string
> = {
  os: 'OS',
  processor: 'Processor',
  memory: 'Memory',
  graphics: 'Graphics',
  storage: 'Storage',
  additionalNotes: 'Additional Notes',
};

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeGameSystemRequirements(
  input: unknown,
): GameSystemRequirements | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'string') {
    return parseStoredGameSystemRequirements(input);
  }

  if (typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const requirements: GameSystemRequirements = {
    requires64Bit: Boolean(record['requires64Bit']),
    os: trimOrNull(String(record['os'] ?? '')),
    processor: trimOrNull(String(record['processor'] ?? '')),
    memory: trimOrNull(String(record['memory'] ?? '')),
    graphics: trimOrNull(String(record['graphics'] ?? '')),
    storage: trimOrNull(String(record['storage'] ?? '')),
    additionalNotes: trimOrNull(String(record['additionalNotes'] ?? '')),
  };

  return hasGameSystemRequirementsContent(requirements) ? requirements : null;
}

export function toRequirementsFormValues(
  requirements: GameSystemRequirements | null | undefined,
): GameSystemRequirementsFormValues {
  if (!requirements) {
    return { ...EMPTY_GAME_SYSTEM_REQUIREMENTS_FORM };
  }

  return {
    requires64Bit: requirements.requires64Bit,
    os: requirements.os ?? '',
    processor: requirements.processor ?? '',
    memory: requirements.memory ?? '',
    graphics: requirements.graphics ?? '',
    storage: requirements.storage ?? '',
    additionalNotes: requirements.additionalNotes ?? '',
  };
}

export function fromRequirementsFormValues(
  values: GameSystemRequirementsFormValues,
): GameSystemRequirements | null {
  const requirements: GameSystemRequirements = {
    requires64Bit: values.requires64Bit,
    os: trimOrNull(values.os),
    processor: trimOrNull(values.processor),
    memory: trimOrNull(values.memory),
    graphics: trimOrNull(values.graphics),
    storage: trimOrNull(values.storage),
    additionalNotes: trimOrNull(values.additionalNotes),
  };

  return hasGameSystemRequirementsContent(requirements) ? requirements : null;
}

export function hasGameSystemRequirementsContent(
  requirements: GameSystemRequirements | null | undefined,
): boolean {
  if (!requirements) {
    return false;
  }

  return (
    requirements.requires64Bit ||
    Boolean(requirements.os) ||
    Boolean(requirements.processor) ||
    Boolean(requirements.memory) ||
    Boolean(requirements.graphics) ||
    Boolean(requirements.storage) ||
    Boolean(requirements.additionalNotes)
  );
}

export function serializeGameSystemRequirements(
  requirements: GameSystemRequirements | null | undefined,
): string | null {
  if (!hasGameSystemRequirementsContent(requirements)) {
    return null;
  }

  return JSON.stringify(requirements);
}

export function parseStoredGameSystemRequirements(
  stored: string | null | undefined,
): GameSystemRequirements | null {
  const trimmed = stored?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('{')) {
    try {
      return normalizeGameSystemRequirements(JSON.parse(trimmed));
    } catch {
      return parseLegacyRequirementsText(trimmed);
    }
  }

  return parseLegacyRequirementsText(trimmed);
}

export function parseLegacyRequirementsText(
  text: string,
): GameSystemRequirements | null {
  const requirements: GameSystemRequirements = {
    requires64Bit: false,
    os: null,
    processor: null,
    memory: null,
    graphics: null,
    storage: null,
    additionalNotes: null,
  };

  const extraNotes: string[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      if (/64-bit/i.test(line)) {
        requirements.requires64Bit = true;
      } else {
        extraNotes.push(line);
      }
      continue;
    }

    const label = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();
    if (!value) {
      continue;
    }

    switch (label) {
      case 'os':
        requirements.os = value;
        break;
      case 'processor':
        requirements.processor = value;
        break;
      case 'memory':
        requirements.memory = value;
        break;
      case 'graphics':
        requirements.graphics = value;
        break;
      case 'storage':
        requirements.storage = value;
        break;
      case 'additional notes':
        requirements.additionalNotes = value;
        break;
      default:
        extraNotes.push(line);
        break;
    }
  }

  if (extraNotes.length > 0) {
    requirements.additionalNotes = [
      requirements.additionalNotes,
      extraNotes.join('\n'),
    ]
      .filter(Boolean)
      .join('\n');
  }

  return hasGameSystemRequirementsContent(requirements) ? requirements : null;
}

export function requirementsToDisplayRows(
  requirements: GameSystemRequirements | null | undefined,
): GameSystemRequirementsRow[] {
  if (!requirements) {
    return [];
  }

  const rows: GameSystemRequirementsRow[] = [];

  if (requirements.requires64Bit) {
    rows.push({
      label: 'Note',
      value: 'Requires a 64-bit processor and operating system',
    });
  }

  for (const key of [
    'os',
    'processor',
    'memory',
    'graphics',
    'storage',
    'additionalNotes',
  ] as const) {
    const value = requirements[key];
    if (value) {
      rows.push({
        label: FIELD_LABELS[key],
        value,
      });
    }
  }

  return rows;
}
