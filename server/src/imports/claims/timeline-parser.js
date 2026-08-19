import { normalizeCellText, parseWorkbookDate } from './value-parser.js';

const REPORT_TYPES = [
  [/\badvance report\b/i, 'ADVANCE_REPORT'],
  [/\bprelim(?:inary)? report\b/i, 'PRELIMINARY_REPORT'],
  [/\b(?:1st|first) report\b/i, 'FIRST_REPORT'],
  [/\b(?:2nd|second) report\b/i, 'SECOND_REPORT'],
  [/\b(?:3rd|third) report\b/i, 'THIRD_REPORT'],
  [/\b(?:4th|fourth) report\b/i, 'FOURTH_REPORT'],
  [/\b(?:5th|fifth) report\b/i, 'FIFTH_REPORT'],
  [/\bevaluation report\b/i, 'EVALUATION_REPORT'],
  [/\bcomprehensive report\b/i, 'COMPREHENSIVE_REPORT'],
  [/\binterim payment report\b/i, 'INTERIM_PAYMENT_REPORT'],
  [/\bfinal report\b/i, 'FINAL_REPORT'],
  [/\bclosing report\b/i, 'CLOSING_REPORT'],
  [/\b(?:addendum|supplementary) report\b/i, 'SUPPLEMENTARY_REPORT'],
];

function detectReportType(text) {
  const match = REPORT_TYPES.find(([pattern]) => pattern.test(text));
  if (!match) return null;
  const base = match[1];
  return /with valuation/i.test(text) ? `${base}_WITH_VALUATION` : base;
}

function detectType(text) {
  if (/letter request/i.test(text)) return 'LETTER_REQUEST';
  if (/denial letter/i.test(text)) return 'DENIAL_LETTER';
  if (/letter offer|offer letter/i.test(text)) return 'OFFER_LETTER';
  if (/release papers?/i.test(text)) return 'RELEASE_PAPERS';
  if (/payment advice|claim check|payment of/i.test(text)) return 'PAYMENT_ADVICE';
  if (detectReportType(text)) return 'REPORT_SUBMITTED';
  return 'STATUS_UPDATE';
}

function extractDate(text) {
  const matches = text.match(/\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/g) || [];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const date = parseWorkbookDate(matches[index]);
    if (date) return date;
  }
  return null;
}

export function parseTimeline(value) {
  const raw = normalizeCellText(value).trim();
  if (!raw) return [];

  return raw
    .split(/;|\r?\n(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((sourceText) => {
      const reportType = detectReportType(sourceText);
      const occurredAt = extractDate(sourceText);
      return {
        type: detectType(sourceText),
        reportType,
        occurredAt,
        description: sourceText,
        sourceText,
        confidence: occurredAt ? 'HIGH' : 'LOW',
      };
    });
}
