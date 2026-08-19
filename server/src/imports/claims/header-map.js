import { normalizeCellText } from './value-parser.js';

const HEADER_ALIASES = {
  itemNumber: ['ITEM NO', 'ITEM NUMBER'],
  dateAssigned: ['DATE ASSIGNED'],
  insuredName: ['INSURED NAME', 'INSURED'],
  insurers: ['INSURER/S', 'INSURERS'],
  insurerClaimNumber: ["INSURER'S LOSS CLAIM NO", 'INSURERS REF. NO', 'CLAIM FILE NO'],
  assignedBy: ['ASSIGNED BY'],
  broker: ['BROKER'],
  ocsReference: ['OCS. REF. NO', 'OCS REF. NO', 'OCS REF NO'],
  handlingAdjuster: ['HANDLING ADJUSTER'],
  dateOfLoss: ['DATE OF LOSS'],
  natureOfLoss: ['NATURE OF LOSS'],
  locationOfLoss: ['LOCATION OF LOSS'],
  contactPerson: ['CONTACT PERSON'],
  policyNumber: ['POLICY NO'],
  policyPeriod: ['POLICY PERIOD'],
  policyType: ['TYPE OF POLICY'],
  policyCoverage: ['POLICY COVERAGE', 'RISK COVERAGE', 'COVERAGE'],
  dateInspected: ['DATE INSPECTED'],
  letterRequestDate: ['DATE OF LETTER REQUEST'],
  denialLetter: ['DENIAL LETTER'],
  denialLetterDate: ['DATE OF DENIAL LETTER'],
  latestReport: ['LATEST REPORT SUBMITTED'],
  latestReportDate: ['DATE OF LATEST REPORT'],
  claimedAmount: ['AMOUNT OF CLAIM'],
  reserve: ['LOSS RESERVE'],
  proposedSettlement: ['PROPOSED SETTLEMENT'],
  agreedSettlement: ['AGREED SETTLEMENT'],
  remarks: ['REMARKS'],
  latestStatus: ['LATEST STATUS', 'STATUS'],
  letterFollowUp: ['FOR FOLLOW UP OF LETTER REQUEST', 'LETTER REQUEST FOLLOW UP', 'FOLLOW UP LETTER REQUEST'],
  paymentAdvice: ['PAYMENT ADVICE', 'PAYMENT STATUS'],
};

function normalizeHeader(value) {
  return normalizeCellText(value)
    .toUpperCase()
    .replace(/[().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapHeaders(values) {
  const normalized = values.map(normalizeHeader);
  const result = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = normalized.findIndex((header) => aliases.some((alias) => header.includes(alias)));
    if (index >= 0) result[field] = index + 1;
  }

  return result;
}

export function findHeaderRow(worksheet, maxRows = 15) {
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, maxRows); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Array.from({ length: worksheet.columnCount }, (_, index) => row.getCell(index + 1).value);
    if (values.some((value) => normalizeHeader(value).includes('ITEM NO'))) return rowNumber;
  }
  return null;
}
