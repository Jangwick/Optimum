import { normalizeCellText, parseMoney, parseWorkbookDate, parsePolicyPeriod } from '../src/imports/claims/value-parser.js';
import { mapHeaders } from '../src/imports/claims/header-map.js';
import { parseInsurerPanel } from '../src/imports/claims/panel-parser.js';
import { parseTimeline } from '../src/imports/claims/timeline-parser.js';
import { inferProcessStatus } from '../src/imports/claims/status-inference.js';
import { parseClaimWorkbook } from '../src/imports/claims/workbook-parser.js';
import ExcelJS from 'exceljs';

describe('claim workbook value parsing', () => {
  it('flattens rich text without losing line breaks', () => {
    expect(
      normalizeCellText({ richText: [{ text: 'Panel' }, { text: '\nMalayan (60%)' }] })
    ).toBe('Panel\nMalayan (60%)');
  });

  it('parses one PHP amount while retaining the original text', () => {
    expect(parseMoney('Reported Amount of Loss\nPhp111,763.00')).toEqual({
      value: '111763.00',
      raw: 'Reported Amount of Loss\nPhp111,763.00',
      disposition: null,
      confidence: 'HIGH',
      issues: [],
    });
  });

  it('treats NIL as zero and Please Advise as unresolved', () => {
    expect(parseMoney('NIL - will not pursue claim')).toMatchObject({ value: '0.00', disposition: 'NIL' });
    expect(parseMoney('Please Advise')).toMatchObject({ value: null, disposition: 'PLEASE_ADVISE' });
  });

  it('flags text containing multiple competing amounts', () => {
    expect(parseMoney('Option 1 Php100,000.00 or Php75,000.00')).toMatchObject({
      value: null,
      confidence: 'LOW',
      issues: ['MULTIPLE_AMOUNTS'],
    });
  });

  it('parses workbook dates and policy date ranges', () => {
    expect(parseWorkbookDate(new Date('2025-08-12T00:00:00.000Z'))?.toISOString()).toBe('2025-08-12T00:00:00.000Z');
    expect(parseWorkbookDate('08/12/25')?.toISOString()).toBe('2025-08-12T00:00:00.000Z');
    expect(parsePolicyPeriod('December 25, 2024 - December 25, 2025')).toMatchObject({
      startDate: new Date('2024-12-25T00:00:00.000Z'),
      endDate: new Date('2025-12-25T00:00:00.000Z'),
    });
  });
});

describe('claim workbook structure parsing', () => {
  it('maps modern and legacy header aliases to canonical fields', () => {
    const modern = mapHeaders(['ITEM NO.', 'DATE ASSIGNED (MM/DD/YY)', 'INSURED NAME', 'OCS. REF. NO.', 'LATEST STATUS']);
    expect(modern).toMatchObject({ itemNumber: 1, dateAssigned: 2, insuredName: 3, ocsReference: 4, latestStatus: 5 });

    const legacy = mapHeaders(['Item No.', 'Date Assigned', 'Insured', 'Insurers Ref. No. / Claim File No.', 'OCS Ref. No.', 'Status']);
    expect(legacy).toMatchObject({ itemNumber: 1, dateAssigned: 2, insuredName: 3, insurerClaimNumber: 4, ocsReference: 5, latestStatus: 6 });
  });

  it('extracts insurer participation and lead markers conservatively', () => {
    const result = parseInsurerPanel('Malayan (Lead) (60%)\nPioneer (25%)\nMAA (15%)');
    expect(result.members).toEqual([
      { sourceName: 'Malayan', participationPercent: '60.00', isLead: true },
      { sourceName: 'Pioneer', participationPercent: '25.00', isLead: false },
      { sourceName: 'MAA', participationPercent: '15.00', isLead: false },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('flags an insurer panel whose known participation does not total 100%', () => {
    expect(parseInsurerPanel('Malayan (60%)\nPioneer (25%)').issues).toContain('PARTICIPATION_TOTAL');
  });
});

describe('claim workbook parsing', () => {
  it('parses active, closed, and cancelled sheets with sheetType and year', async () => {
    const workbook = new ExcelJS.Workbook();
    const active = workbook.addWorksheet('Assignment2025');
    active.addRows([
      ['OPTIMUM CLAIMS'],
      ['Registry'],
      ['2025'],
      ['Assignments'],
      ['Assignments'],
      [
        'ITEM NO.',
        'DATE ASSIGNED',
        'INSURED NAME',
        'INSURER/S',
        "INSURER'S LOSS CLAIM NO.",
        'ASSIGNED BY',
        'BROKER',
        'OCS. REF. NO.',
        'HANDLING ADJUSTER',
        'DATE OF LOSS',
        'NATURE OF LOSS',
        'LOCATION OF LOSS',
        'CONTACT PERSON',
        'POLICY NO.',
        'POLICY PERIOD',
        'TYPE OF POLICY',
        'POLICY COVERAGE / TOTAL SUM INSURED',
        'DATE INSPECTED',
        'DATE OF LETTER REQUEST',
        'DATE OF DENIAL LETTER',
        'AMOUNT OF CLAIM',
        'LOSS RESERVE',
        'PROPOSED SETTLEMENT',
        'AGREED SETTLEMENT',
        'REMARKS',
        'LATEST STATUS',
        'LETTER REQUEST FOLLOW UP',
      ],
      [
        1,
        new Date('2025-01-02T00:00:00.000Z'),
        'Acme Corp',
        'Malayan (100%)',
        'INS-1',
        'Jane Assignor',
        'Broker Co. (BR-1)',
        'OCS-012501/ABC',
        'ABC',
        '12/31/24',
        'Fire',
        'Cebu',
        'Juan 09171234567',
        'POL-1',
        'January 1, 2024 - January 1, 2025',
        'Property All Risk',
        'PHP1,000,000.00',
        '01/03/25',
        '01/04/25',
        '',
        'Php100,000.00',
        'Php80,000.00',
        '',
        '',
        'Letter request sent on 01.04.25',
        '',
        '01/20/25',
      ],
    ]);
    const closed = workbook.addWorksheet('CLOSED2025');
    closed.addRows([
      ['ITEM NO.', 'OCS. REF. NO.', 'INSURED NAME', 'LATEST STATUS'],
      [1, 'OCS-CLOSED-1', 'Closed Corp', 'Closed'],
    ]);
    const cancelled = workbook.addWorksheet('CANCELLED2025');
    cancelled.addRows([
      ['ITEM NO.', 'OCS. REF. NO.', 'INSURED NAME', 'LATEST STATUS'],
      [1, 'OCS-CANCELLED-1', 'Cancelled Corp', 'Cancelled'],
    ]);
    // Lookup sheet should be ignored
    const lookup = workbook.addWorksheet('SHEET2024');
    lookup.addRow(['Status', 'Description']);
    lookup.addRow(['CLOSED', 'Closed']);

    const buffer = await workbook.xlsx.writeBuffer();
    const result = await parseClaimWorkbook(buffer);

    expect(result.sheets).toHaveLength(3);
    const activeSheet = result.sheets.find((s) => s.name === 'Assignment2025');
    expect(activeSheet).toMatchObject({ type: 'ACTIVE', year: 2025, rowCount: 1 });
    const closedSheet = result.sheets.find((s) => s.name === 'CLOSED2025');
    expect(closedSheet).toMatchObject({ type: 'CLOSED', year: 2025, rowCount: 1 });
    const cancelledSheet = result.sheets.find((s) => s.name === 'CANCELLED2025');
    expect(cancelledSheet).toMatchObject({ type: 'CANCELLED', year: 2025, rowCount: 1 });

    expect(result.rows).toHaveLength(3);

    const activeRow = result.rows.find((r) => r.ocsReference === 'OCS-012501/ABC');
    expect(activeRow).toMatchObject({
      sourceSheet: 'Assignment2025',
      sheetType: 'ACTIVE',
      year: 2025,
      ocsReference: 'OCS-012501/ABC',
      insuredName: 'Acme Corp',
      handlingAdjuster: 'ABC',
      claimedAmount: '100000.00',
      reserve: '80000.00',
      isReadOnly: false,
      isCancelled: false,
      suggestedProcessStatus: 'DOCUMENTS_REQUIRED',
      suggestedImportStatus: 'AWAITING_DOCUMENTS',
    });

    const closedRow = result.rows.find((r) => r.ocsReference === 'OCS-CLOSED-1');
    expect(closedRow).toMatchObject({
      sheetType: 'CLOSED',
      isReadOnly: true,
      isCancelled: false,
      suggestedProcessStatus: 'CLAIM_CLOSED',
      suggestedImportStatus: 'CLOSED',
    });

    const cancelledRow = result.rows.find((r) => r.ocsReference === 'OCS-CANCELLED-1');
    expect(cancelledRow).toMatchObject({
      sheetType: 'CANCELLED',
      isReadOnly: true,
      isCancelled: true,
      suggestedProcessStatus: 'CLAIM_CLOSED',
      suggestedImportStatus: 'CANCELLED',
    });
  });
});

describe('timeline and process status parsing', () => {
  it('extracts dated report and letter events and preserves source text', () => {
    const events = parseTimeline('Letter request sent to broker on 01.27.26; First Report sent to insurer on 02.03.26.');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: 'LETTER_REQUEST', occurredAt: new Date('2026-01-27T00:00:00.000Z') });
    expect(events[1]).toMatchObject({ type: 'REPORT_SUBMITTED', reportType: 'FIRST_REPORT' });
  });

  it('infers late-stage statuses before early-stage phrases and maps to 18-stage codes', () => {
    expect(inferProcessStatus({ remarks: 'Signed offer received. FOR CLOSING & BILLING' })).toMatchObject({
      code: 'CLAIM_SETTLED',
      importCode: 'FOR_CLOSING_AND_BILLING',
      confidence: 'HIGH',
    });
    expect(inferProcessStatus({ remarks: 'Letter offer declined. For re-evaluation' })).toMatchObject({
      code: 'FURTHER_CLARIFICATION',
      importCode: 'OFFER_DECLINED_REEVALUATION',
      confidence: 'HIGH',
    });
    expect(inferProcessStatus({ remarks: '' })).toMatchObject({
      code: 'DOCUMENTS_REQUIRED',
      importCode: 'AWAITING_DOCUMENTS',
      confidence: 'LOW',
    });
  });

  it('infers CLAIM_CLOSED from sheet type for closed and cancelled sheets', () => {
    expect(inferProcessStatus({ sheetType: 'CLOSED' })).toMatchObject({
      code: 'CLAIM_CLOSED',
      importCode: 'CLOSED',
      confidence: 'HIGH',
    });
    expect(inferProcessStatus({ sheetType: 'CANCELLED' })).toMatchObject({
      code: 'CLAIM_CLOSED',
      importCode: 'CANCELLED',
      confidence: 'HIGH',
    });
  });
});
