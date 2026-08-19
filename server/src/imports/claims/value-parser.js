const PLACEHOLDER_PATTERN = /^(please advise|tba|to be advised|n\/a|na)$/i;

export function normalizeCellText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text || '').join('');
  }
  if (typeof value === 'object' && value.text !== undefined) return String(value.text);
  if (typeof value === 'object' && value.result !== undefined) return normalizeCellText(value.result);
  return String(value);
}

export function isPlaceholder(value) {
  return PLACEHOLDER_PATTERN.test(normalizeCellText(value).trim());
}

export function parseMoney(value) {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { value: null, raw, disposition: null, confidence: 'HIGH', issues: [] };
  if (/please advise|to be advised|\btba\b/i.test(raw)) {
    return { value: null, raw, disposition: 'PLEASE_ADVISE', confidence: 'HIGH', issues: [] };
  }
  if (/\bnil\b/i.test(raw)) {
    return { value: '0.00', raw, disposition: 'NIL', confidence: 'HIGH', issues: [] };
  }

  const matches = [...raw.matchAll(/(?:php|ph₱|₱)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi)]
    .map((match) => match[1].replace(/,/g, ''))
    .filter((match) => Number.isFinite(Number(match)));
  const unique = [...new Set(matches)];

  if (unique.length === 0) {
    return { value: null, raw, disposition: null, confidence: 'LOW', issues: ['UNPARSEABLE_AMOUNT'] };
  }
  if (unique.length > 1) {
    return { value: null, raw, disposition: null, confidence: 'LOW', issues: ['MULTIPLE_AMOUNTS'] };
  }

  return {
    value: Number(unique[0]).toFixed(2),
    raw,
    disposition: null,
    confidence: 'HIGH',
    issues: [],
  };
}

export function parseWorkbookDate(value) {
  if (!value || isPlaceholder(value)) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const text = normalizeCellText(value).trim();
  const numeric = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})\b/);
  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    let year = Number(numeric[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return date;
    return null;
  }

  const monthName = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (monthName) {
    const parsed = new Date(`${monthName[1]} ${monthName[2]}, ${monthName[3]} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function parsePolicyPeriod(value) {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { startDate: null, endDate: null, raw, confidence: 'LOW' };

  const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}';
  const namedDates = raw.match(new RegExp(monthPattern, 'gi')) || [];
  const numericDates = raw.match(/\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/g) || [];
  const dates = [...namedDates, ...numericDates].map(parseWorkbookDate).filter(Boolean);

  return {
    startDate: dates[0] || null,
    endDate: dates[1] || null,
    raw,
    confidence: dates.length >= 2 ? 'HIGH' : 'LOW',
  };
}
