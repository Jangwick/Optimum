import { normalizeCellText } from './value-parser.js';

const STATUS_RULES = [
  { code: 'CANCELLED', pattern: /\bcancell?ed\b/i },
  { code: 'CLOSED', pattern: /\bclosed\b(?!\s+no\s+bill)/i },
  { code: 'FOR_CLOSING_WAIVED_BILLING', pattern: /closed no bill|waived billing|no billing/i },
  { code: 'FOR_CLOSING_AND_BILLING', pattern: /for closing\s*(?:&|and)\s*billing|closing report\s*(?:&|and)\s*billing/i },
  { code: 'OFFER_DECLINED_REEVALUATION', pattern: /offer.*declin|declin.*offer|re-?evaluation/i },
  { code: 'FOR_LETTER_OFFER', pattern: /for letter offer|letter offer.*sent|offer letter.*sent|release papers.*sent/i },
  { code: 'AWAITING_INSURER_INSTRUCTION', pattern: /awaiting insurer|waiting instruction|follow lead|insurer.*instruction/i },
  { code: 'LETTER_AND_REPORT_UNDER_REVIEW', pattern: /letter.*report.*under review|report.*letter.*under review/i },
  { code: 'LETTER_REQUEST_UNDER_REVIEW', pattern: /letter request.*under review/i },
  { code: 'REPORT_UNDER_REVIEW', pattern: /report.*under review|for evaluation|with valuation/i },
  { code: 'DOCUMENTS_UNDER_REVIEW', pattern: /documents?.*(?:received|under review)|submitted documents/i },
];

export function inferProcessStatus({ latestStatus = '', remarks = '', letterFollowUp = '', sourceSheet = '' } = {}) {
  const source = [latestStatus, remarks, letterFollowUp].map(normalizeCellText).filter(Boolean).join(' ');
  const sheet = normalizeCellText(sourceSheet);

  if (/cancelled/i.test(sheet)) return { code: 'CANCELLED', confidence: 'HIGH', reason: 'Source sheet is cancelled' };
  if (/closed/i.test(sheet)) return { code: 'CLOSED', confidence: 'HIGH', reason: 'Source sheet is closed' };

  const rule = STATUS_RULES.find(({ pattern }) => pattern.test(source));
  if (rule) return { code: rule.code, confidence: 'HIGH', reason: `Matched ${rule.pattern}` };

  return {
    code: 'AWAITING_DOCUMENTS',
    confidence: source ? 'MEDIUM' : 'LOW',
    reason: source ? 'No later-stage evidence found' : 'No status evidence available',
  };
}

export const PROCESS_STATUSES = [
  'AWAITING_DOCUMENTS',
  'DOCUMENTS_UNDER_REVIEW',
  'REPORT_UNDER_REVIEW',
  'LETTER_REQUEST_UNDER_REVIEW',
  'LETTER_AND_REPORT_UNDER_REVIEW',
  'AWAITING_INSURER_INSTRUCTION',
  'FOR_LETTER_OFFER',
  'OFFER_DECLINED_REEVALUATION',
  'FOR_CLOSING_AND_BILLING',
  'FOR_CLOSING_WAIVED_BILLING',
  'CLOSED',
  'CANCELLED',
];
