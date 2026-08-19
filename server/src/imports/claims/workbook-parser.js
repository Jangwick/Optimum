import ExcelJS from 'exceljs';
import { findHeaderRow, mapHeaders } from './header-map.js';
import { normalizeCellText, parseMoney, parsePolicyPeriod, parseWorkbookDate } from './value-parser.js';
import { parseInsurerPanel } from './panel-parser.js';
import { parseTimeline } from './timeline-parser.js';
import { inferProcessStatus } from './status-inference.js';

const MAX_SHEETS = 50;
const MAX_ROWS_PER_SHEET = 10000;
const MAX_COLUMNS_PER_SHEET = 100;

// Classify a sheet name into a type and extract the year if present.
// Returns { type, year } where type is one of:
//   ACTIVE    — assignment sheets with open/in-progress claims
//   CLOSED    — closed register sheets
//   CANCELLED — cancelled register sheets
//   LOOKUP    — reference/lookup sheets (status lists, report types)
//   IGNORE    — anything else
function classifySheet(name) {
  const trimmed = name.trim();

  if (/cancelled/i.test(trimmed)) {
    const match = trimmed.match(/(20\d{2})/);
    return { type: 'CANCELLED', year: match ? Number(match[1]) : null };
  }
  if (/closed/i.test(trimmed)) {
    const match = trimmed.match(/(20\d{2})/);
    return { type: 'CLOSED', year: match ? Number(match[1]) : null };
  }
  const assignMatch = trimmed.match(/^assignment\s*(20\d{2})$/i);
  if (assignMatch) {
    return { type: 'ACTIVE', year: Number(assignMatch[1]) };
  }
  if (/^sheet/i.test(trimmed)) {
    return { type: 'LOOKUP', year: null };
  }
  return { type: 'IGNORE', year: null };
}

// Sheet types that contain importable claim rows.
const IMPORTABLE_SHEET_TYPES = new Set(['ACTIVE', 'CLOSED', 'CANCELLED']);

function cell(row, column) {
  return column ? normalizeCellText(row.getCell(column).value).trim() : '';
}

function iso(value) {
  return parseWorkbookDate(value)?.toISOString() || null;
}

function combineTimeline(values) {
  return values.filter(Boolean).join('; ');
}

function parseRow(worksheet, sourceRow, headers, sheetType, year) {
  const row = worksheet.getRow(sourceRow);
  const claimed = parseMoney(cell(row, headers.claimedAmount));
  const reserve = parseMoney(cell(row, headers.reserve));
  const proposed = parseMoney(cell(row, headers.proposedSettlement));
  const agreed = parseMoney(cell(row, headers.agreedSettlement));
  const policyPeriod = parsePolicyPeriod(cell(row, headers.policyPeriod));
  const insurers = parseInsurerPanel(cell(row, headers.insurers));
  const remarks = cell(row, headers.remarks);
  const latestStatus = cell(row, headers.latestStatus);
  const letterFollowUp = cell(row, headers.letterFollowUp);
  const timeline = parseTimeline(combineTimeline([remarks, latestStatus, letterFollowUp]));
  const status = inferProcessStatus({ remarks, latestStatus, letterFollowUp, sourceSheet: worksheet.name, sheetType });
  const issues = [...insurers.issues];

  const ocsReference = cell(row, headers.ocsReference);
  const insuredName = cell(row, headers.insuredName);
  const handlingAdjuster = cell(row, headers.handlingAdjuster);
  if (!ocsReference) issues.push('MISSING_OCS_REFERENCE');
  if (!insuredName) issues.push('MISSING_INSURED');
  if (!handlingAdjuster) issues.push('MISSING_ADJUSTER');
  if (status.confidence === 'LOW') issues.push('LOW_CONFIDENCE_STATUS');
  for (const amount of [claimed, reserve, proposed, agreed]) issues.push(...amount.issues);

  const rawData = {};
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    const header = normalizeCellText(worksheet.getRow(headers.headerRow).getCell(column).value).trim() || `COLUMN_${column}`;
    rawData[header] = normalizeCellText(row.getCell(column).value);
  }

  return {
    sourceSheet: worksheet.name,
    sourceRow,
    sheetType,
    year,
    itemNumber: cell(row, headers.itemNumber),
    dateAssigned: iso(row.getCell(headers.dateAssigned || 1).value),
    insuredName,
    insurers: insurers.members,
    insurersRaw: insurers.raw,
    insurerClaimNumber: cell(row, headers.insurerClaimNumber),
    assignedBy: cell(row, headers.assignedBy),
    brokerRaw: cell(row, headers.broker),
    ocsReference,
    handlingAdjuster,
    dateOfLoss: iso(row.getCell(headers.dateOfLoss || 1).value),
    natureOfLoss: cell(row, headers.natureOfLoss),
    locationOfLoss: cell(row, headers.locationOfLoss),
    contactRaw: cell(row, headers.contactPerson),
    policyNumber: cell(row, headers.policyNumber),
    policyPeriodRaw: policyPeriod.raw,
    policyStartDate: policyPeriod.startDate?.toISOString() || null,
    policyEndDate: policyPeriod.endDate?.toISOString() || null,
    policyType: cell(row, headers.policyType),
    policyCoverage: cell(row, headers.policyCoverage),
    dateInspected: iso(row.getCell(headers.dateInspected || 1).value),
    letterRequestDate: iso(row.getCell(headers.letterRequestDate || 1).value),
    denialLetterDate: iso(row.getCell(headers.denialLetterDate || 1).value),
    latestReport: cell(row, headers.latestReport),
    latestReportDate: iso(row.getCell(headers.latestReportDate || 1).value),
    claimedAmount: claimed.value,
    claimedAmountRaw: claimed.raw,
    reserve: reserve.value,
    reserveRaw: reserve.raw,
    proposedSettlement: proposed.value,
    proposedSettlementRaw: proposed.raw,
    agreedSettlement: agreed.value,
    agreedSettlementRaw: agreed.raw,
    remarks,
    latestStatus,
    letterFollowUp,
    paymentAdvice: cell(row, headers.paymentAdvice),
    suggestedProcessStatus: status.code,
    suggestedImportStatus: status.importCode,
    statusConfidence: status.confidence,
    statusReason: status.reason,
    isReadOnly: sheetType === 'CLOSED' || sheetType === 'CANCELLED',
    isCancelled: sheetType === 'CANCELLED',
    timeline,
    issues: [...new Set(issues)],
    rawData,
  };
}

export async function parseClaimWorkbook(input) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input);
  if (workbook.worksheets.length > MAX_SHEETS) throw new Error('Workbook has too many sheets');

  const rows = [];
  const sheets = [];

  for (const worksheet of workbook.worksheets) {
    const { type, year } = classifySheet(worksheet.name);
    if (!IMPORTABLE_SHEET_TYPES.has(type)) continue;
    if (worksheet.rowCount > MAX_ROWS_PER_SHEET) throw new Error(`Sheet ${worksheet.name} has too many rows`);
    if (worksheet.columnCount > MAX_COLUMNS_PER_SHEET) throw new Error(`Sheet ${worksheet.name} has too many columns`);

    const headerRow = findHeaderRow(worksheet);
    if (!headerRow) throw new Error(`Could not find headers in ${worksheet.name}`);
    const headerValues = Array.from(
      { length: worksheet.columnCount },
      (_, index) => worksheet.getRow(headerRow).getCell(index + 1).value
    );
    const headers = { ...mapHeaders(headerValues), headerRow };
    if (!headers.itemNumber || !headers.ocsReference) throw new Error(`Required headers missing in ${worksheet.name}`);

    let rowCount = 0;
    for (let sourceRow = headerRow + 1; sourceRow <= worksheet.rowCount; sourceRow += 1) {
      const row = worksheet.getRow(sourceRow);
      if (!cell(row, headers.itemNumber) && !cell(row, headers.ocsReference)) continue;
      rows.push(parseRow(worksheet, sourceRow, headers, type, year));
      rowCount += 1;
    }
    sheets.push({ name: worksheet.name, type, year, rowCount });
  }

  if (sheets.length === 0) throw new Error('No importable sheets found');
  return { sheets, rows };
}
