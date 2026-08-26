// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

export function sanitizeLogString(value: string): string {
  return value.replace(CONTROL_CHARS, '\uFFFD').trim();
}

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeLogString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeLogValue(nested);
    }
    return sanitized;
  }

  return value;
}
