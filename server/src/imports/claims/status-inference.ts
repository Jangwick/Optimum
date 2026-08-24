import { normalizeCellText } from './value-parser.js';

export type ProcessStatus =
  | 'NEW_CLAIM'
  | 'CLAIM_ASSIGNED'
  | 'INITIAL_REVIEW'
  | 'CONTACTED_INSURED'
  | 'SITE_INSPECTION_SCHEDULED'
  | 'UNDER_INVESTIGATION'
  | 'INSPECTION_COMPLETED'
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENTS_RECEIVED'
  | 'LOSS_ASSESSMENT'
  | 'RESERVE_LOSS_ESTIMATE_PREPARED'
  | 'REPORT_PREPARATION'
  | 'REPORT_SUBMITTED'
  | 'CLIENT_REVIEW'
  | 'FURTHER_CLARIFICATION'
  | 'ADJUSTMENT_COMPLETED'
  | 'CLAIM_SETTLED'
  | 'CLAIM_CLOSED';

export type ImportStatus =
  | 'AWAITING_DOCUMENTS'
  | 'DOCUMENTS_UNDER_REVIEW'
  | 'REPORT_UNDER_REVIEW'
  | 'LETTER_REQUEST_UNDER_REVIEW'
  | 'LETTER_AND_REPORT_UNDER_REVIEW'
  | 'AWAITING_INSURER_INSTRUCTION'
  | 'FOR_LETTER_OFFER'
  | 'OFFER_DECLINED_REEVALUATION'
  | 'FOR_CLOSING_AND_BILLING'
  | 'FOR_CLOSING_WAIVED_BILLING'
  | 'CLOSED'
  | 'CANCELLED';

export type StatusConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

// The 18 primary workflow statuses.
export const PROCESS_STATUSES: ProcessStatus[] = [
  'NEW_CLAIM',
  'CLAIM_ASSIGNED',
  'INITIAL_REVIEW',
  'CONTACTED_INSURED',
  'SITE_INSPECTION_SCHEDULED',
  'UNDER_INVESTIGATION',
  'INSPECTION_COMPLETED',
  'DOCUMENTS_REQUIRED',
  'DOCUMENTS_RECEIVED',
  'LOSS_ASSESSMENT',
  'RESERVE_LOSS_ESTIMATE_PREPARED',
  'REPORT_PREPARATION',
  'REPORT_SUBMITTED',
  'CLIENT_REVIEW',
  'FURTHER_CLARIFICATION',
  'ADJUSTMENT_COMPLETED',
  'CLAIM_SETTLED',
  'CLAIM_CLOSED',
];

// The 12 OCS import statuses (read-only on historical records).
export const IMPORT_STATUSES: ImportStatus[] = [
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

// OCS 12-status inference rules (for the importStatus field on historical records).
// Ordered from terminal/late stage to early stage.
interface OcsStatusRule {
  code: ImportStatus;
  pattern: RegExp;
}

const OCS_STATUS_RULES: OcsStatusRule[] = [
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

// Map OCS 12-status → 18-stage primary workflow status.
const OCS_TO_18: Partial<Record<ImportStatus, ProcessStatus>> = {
  DOCUMENTS_UNDER_REVIEW: 'DOCUMENTS_RECEIVED',
  REPORT_UNDER_REVIEW: 'CLIENT_REVIEW',
  LETTER_REQUEST_UNDER_REVIEW: 'CLIENT_REVIEW',
  LETTER_AND_REPORT_UNDER_REVIEW: 'CLIENT_REVIEW',
  AWAITING_INSURER_INSTRUCTION: 'CLIENT_REVIEW',
  FOR_LETTER_OFFER: 'ADJUSTMENT_COMPLETED',
  OFFER_DECLINED_REEVALUATION: 'FURTHER_CLARIFICATION',
  FOR_CLOSING_AND_BILLING: 'CLAIM_SETTLED',
  FOR_CLOSING_WAIVED_BILLING: 'CLAIM_SETTLED',
  CLOSED: 'CLAIM_CLOSED',
  CANCELLED: 'CLAIM_CLOSED',
};

export interface StatusInput {
  latestStatus?: string;
  remarks?: string;
  letterFollowUp?: string;
  sourceSheet?: string;
  sheetType?: string;
}

export interface StatusResult {
  code: ProcessStatus;
  importCode: ImportStatus;
  confidence: StatusConfidence;
  reason: string;
}

// Infer both the 18-stage primary status and the OCS 12 import status.
// sheetType: 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'LOOKUP' | 'IGNORE'
export function inferProcessStatus({
  latestStatus = '',
  remarks = '',
  letterFollowUp = '',
  sourceSheet = '',
  sheetType = '',
}: StatusInput = {}): StatusResult {
  const source = [latestStatus, remarks, letterFollowUp].map(normalizeCellText).filter(Boolean).join(' ');
  const sheet = normalizeCellText(sourceSheet);

  // Sheet-type-based inference (highest confidence)
  if (sheetType === 'CANCELLED' || /cancelled/i.test(sheet)) {
    return {
      code: 'CLAIM_CLOSED',
      importCode: 'CANCELLED',
      confidence: 'HIGH',
      reason: 'Source sheet is cancelled',
    };
  }
  if (sheetType === 'CLOSED' || /closed/i.test(sheet)) {
    return {
      code: 'CLAIM_CLOSED',
      importCode: 'CLOSED',
      confidence: 'HIGH',
      reason: 'Source sheet is closed',
    };
  }

  // Text-based OCS status inference
  const rule = OCS_STATUS_RULES.find(({ pattern }) => pattern.test(source));
  if (rule) {
    return {
      code: OCS_TO_18[rule.code] ?? 'DOCUMENTS_REQUIRED',
      importCode: rule.code,
      confidence: 'HIGH',
      reason: `Matched ${String(rule.pattern)}`,
    };
  }

  // Default: awaiting documents stage
  return {
    code: 'DOCUMENTS_REQUIRED',
    importCode: 'AWAITING_DOCUMENTS',
    confidence: source ? 'MEDIUM' : 'LOW',
    reason: source ? 'No later-stage evidence found' : 'No status evidence available',
  };
}
