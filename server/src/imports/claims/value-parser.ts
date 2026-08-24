const PLACEHOLDER_PATTERN = /^(please advise|tba|to be advised|n\/a|na)$/i;

export function normalizeCellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'richText' in value) {
    const richText = (value as Record<string, unknown>).richText;
    if (Array.isArray(richText)) {
      return richText
        .map((part) => {
          if (typeof part === 'object' && part !== null && 'text' in part) {
            return String((part as Record<string, unknown>).text ?? '');
          }
          return '';
        })
        .join('');
    }
  }
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as Record<string, unknown>).text);
  }
  if (typeof value === 'object' && value !== null && 'result' in value) {
    return normalizeCellText((value as Record<string, unknown>).result);
  }
  return String(value);
}

export function isPlaceholder(value: unknown): boolean {
  return PLACEHOLDER_PATTERN.test(normalizeCellText(value).trim());
}

export interface MoneyParseResult {
  value: string | null;
  raw: string;
  disposition: 'PLEASE_ADVISE' | 'NIL' | null;
  confidence: 'HIGH' | 'LOW';
  issues: string[];
}

export function parseMoney(value: unknown): MoneyParseResult {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { value: null, raw, disposition: null, confidence: 'HIGH', issues: [] };
  if (/please advise|to be advised|\btba\b/i.test(raw)) {
    return { value: null, raw, disposition: 'PLEASE_ADVISE', confidence: 'HIGH', issues: [] };
  }
  if (/\bnil\b/i.test(raw)) {
    return { value: '0.00', raw, disposition: 'NIL', confidence: 'HIGH', issues: [] };
  }

  const matches = [...raw.matchAll(/(?:php|ph₱|₱)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi)]
    .map((match) => (match[1] ?? '').replace(/,/g, ''))
    .filter((match) => Number.isFinite(Number(match)));
  const unique = [...new Set(matches)];

  if (unique.length === 0) {
    return { value: null, raw, disposition: null, confidence: 'LOW', issues: ['UNPARSEABLE_AMOUNT'] };
  }
  if (unique.length > 1) {
    return { value: null, raw, disposition: null, confidence: 'LOW', issues: ['MULTIPLE_AMOUNTS'] };
  }

  return {
    value: Number(unique[0]!).toFixed(2),
    raw,
    disposition: null,
    confidence: 'HIGH',
    issues: [],
  };
}

export function parseWorkbookDate(value: unknown): Date | null {
  if (!value || isPlaceholder(value)) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const text = normalizeCellText(value).trim();
  const numeric = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})\b/);
  if (numeric) {
    const [, month, day, year] = numeric;
    if (month === undefined || day === undefined || year === undefined) return null;
    const monthNum = Number(month);
    const dayNum = Number(day);
    let yearNum = Number(year);
    if (yearNum < 100) yearNum += yearNum >= 70 ? 1900 : 2000;
    const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    if (date.getUTCFullYear() === yearNum && date.getUTCMonth() === monthNum - 1 && date.getUTCDate() === dayNum) return date;
    return null;
  }

  const monthName = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  );
  if (monthName) {
    const [, month, day, year] = monthName;
    if (month === undefined || day === undefined || year === undefined) return null;
    const parsed = new Date(`${month} ${day}, ${year} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export interface PolicyPeriodResult {
  startDate: Date | null;
  endDate: Date | null;
  raw: string;
  confidence: 'HIGH' | 'LOW';
}

export function parsePolicyPeriod(value: unknown): PolicyPeriodResult {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { startDate: null, endDate: null, raw, confidence: 'LOW' };

  const monthPattern =
    '(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}';
  const namedDates = raw.match(new RegExp(monthPattern, 'gi')) || [];
  const numericDates = raw.match(/\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/g) || [];
  const dates = [...namedDates, ...numericDates]
    .map(parseWorkbookDate)
    .filter((date): date is Date => date !== null);

  return {
    startDate: dates[0] ?? null,
    endDate: dates[1] ?? null,
    raw,
    confidence: dates.length >= 2 ? 'HIGH' : 'LOW',
  };
}
