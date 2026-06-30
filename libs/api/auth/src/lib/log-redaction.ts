const SENSITIVE_KEY_PATTERN =
  /password|licensekey|license_key|authorization|token|secret|shared_secret/i;

export function redactSensitiveValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }
  return value;
}

export function redactForAuditLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactForAuditLog(entry));
  }

  if (typeof value !== 'object') {
    return value;
  }

  const record = value as Record<string, unknown>;
  const redacted: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(record)) {
    const next = redactSensitiveValue(key, entry);
    redacted[key] =
      next !== entry || typeof entry !== 'object' ? next : redactForAuditLog(entry);
  }

  return redacted;
}

/** Store only a hint of license keys in audit metadata — never the full key. */
export function licenseKeyAuditHint(licenseKey: string): string {
  const trimmed = licenseKey.trim();
  if (trimmed.length <= 4) {
    return '****';
  }
  return `****${trimmed.slice(-4)}`;
}
