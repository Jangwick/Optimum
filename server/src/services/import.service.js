import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { parseClaimWorkbook } from '../imports/claims/workbook-parser.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Map inferred workbook status codes to ProcessStatus codes in the database.
// Conservative: maps to the closest OCS process stage. Unmapped codes default
// to AWAITING_DOCUMENTS (a safe middle-stage status for review).
const INFERRED_TO_PROCESS = {
  AWAITING_DOCUMENTS: 'AWAITING_DOCUMENTS',
  DOCUMENTS_UNDER_REVIEW: 'DOCUMENTS_RECEIVED',
  REPORT_UNDER_REVIEW: 'REPORT_SUBMITTED',
  LETTER_REQUEST_UNDER_REVIEW: 'LETTER_REQUEST_UNDER_REVIEW',
  LETTER_AND_REPORT_UNDER_REVIEW: 'LETTER_REQUEST_UNDER_REVIEW',
  AWAITING_INSURER_INSTRUCTION: 'AWAITING_DOCUMENTS',
  FOR_LETTER_OFFER: 'SETTLED',
  OFFER_DECLINED_REEVALUATION: 'UNDER_ASSESSMENT',
  FOR_CLOSING_AND_BILLING: 'SETTLED',
  FOR_CLOSING_WAIVED_BILLING: 'SETTLED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CLOSED',
};

function inferredToProcessCode(inferredCode) {
  return INFERRED_TO_PROCESS[inferredCode] || 'AWAITING_DOCUMENTS';
}

const IMPORT_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads', 'imports');

function ensureImportDir() {
  if (!fs.existsSync(IMPORT_DIR)) {
    fs.mkdirSync(IMPORT_DIR, { recursive: true });
  }
}

function fileHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Normalize a mapped row's data for claim creation.
// Only includes fields that are present and non-null.
function buildClaimDataFromMappedRow(row, context) {
  const m = row.mappedData || {};
  const data = {
    isIncomplete: (row.issues && row.issues.length > 0) || false,
    incompleteReasons: row.issues && row.issues.length > 0 ? row.issues : null,
    importedAt: new Date(),
    lastUserModifiedAt: null,
  };

  // Registry fields
  if (m.claimNumber) data.claimNumber = String(m.claimNumber).trim();
  if (m.assignmentNumber) data.assignmentNumber = String(m.assignmentNumber).trim();
  if (m.insurerClaimNumber) data.insurerClaimNumber = String(m.insurerClaimNumber).trim();
  if (m.brokerReference) data.brokerReference = String(m.brokerReference).trim();

  // Amounts — preserve raw text alongside normalized values
  if (m.claimedAmount !== undefined && m.claimedAmount !== null) {
    data.claimedAmount = Number(m.claimedAmount) || null;
  }
  if (m.claimedAmountRaw) data.claimedAmountRaw = m.claimedAmountRaw;
  if (m.reserve !== undefined && m.reserve !== null) {
    data.reserve = Number(m.reserve) || null;
  }
  if (m.reserveRaw) data.reserveRaw = m.reserveRaw;
  if (m.proposedSettlement !== undefined && m.proposedSettlement !== null) {
    data.proposedSettlement = Number(m.proposedSettlement) || null;
  }
  if (m.proposedSettlementRaw) data.proposedSettlementRaw = m.proposedSettlementRaw;
  if (m.agreedSettlement !== undefined && m.agreedSettlement !== null) {
    data.agreedSettlement = Number(m.agreedSettlement) || null;
  }
  if (m.agreedSettlementRaw) data.agreedSettlementRaw = m.agreedSettlementRaw;

  // Descriptive fields
  if (m.natureOfLoss) data.natureOfLoss = m.natureOfLoss;
  if (m.locationOfLoss) data.locationOfLoss = m.locationOfLoss;
  if (m.description) data.description = m.description;
  if (m.policyPeriodText) data.policyPeriodText = m.policyPeriodText;
  if (m.policyCoverageText) data.policyCoverageText = m.policyCoverageText;
  if (m.classification) data.classification = m.classification;
  if (m.assignedByName) data.assignedByName = m.assignedByName;
  if (m.remarksRaw) data.remarksRaw = m.remarksRaw;
  if (m.latestStatusRaw) data.latestStatusRaw = m.latestStatusRaw;
  if (m.letterFollowUpRaw) data.letterFollowUpRaw = m.letterFollowUpRaw;

  // Dates
  if (m.dateOfLoss) data.dateOfLoss = new Date(m.dateOfLoss);
  if (m.dateReceived) data.dateReceived = new Date(m.dateReceived);

  // Relations — resolve by ID from context
  if (m.claimTypeId) data.claimTypeId = Number(m.claimTypeId);
  if (m.clientId) data.clientId = Number(m.clientId);
  if (m.insuranceCompanyId) data.insuranceCompanyId = Number(m.insuranceCompanyId);
  if (m.brokerId) data.brokerId = Number(m.brokerId);
  if (m.policyId) data.policyId = Number(m.policyId);
  if (m.engineerId) data.engineerId = Number(m.engineerId);
  if (m.accountantId) data.accountantId = Number(m.accountantId);

  // Statuses
  if (context.defaultStatusId) data.statusId = context.defaultStatusId;
  if (context.defaultProcessStatusId) {
    data.processStatusId = context.defaultProcessStatusId;
  }
  // Override process status if inference produced a specific code
  if (row.inferredStatus) {
    const processCode = inferredToProcessCode(row.inferredStatus);
    if (processCode && context.processStatusByCode[processCode]) {
      data.processStatusId = context.processStatusByCode[processCode].id;
    }
  }

  data.createdById = context.importedById;

  return data;
}

// Detect duplicates by claimNumber or assignmentNumber
async function findDuplicate(mappedData, excludeClaimId = null) {
  if (!mappedData) return null;
  const or = [];
  if (mappedData.claimNumber) {
    or.push({ claimNumber: String(mappedData.claimNumber).trim() });
  }
  if (mappedData.assignmentNumber) {
    or.push({ assignmentNumber: String(mappedData.assignmentNumber).trim() });
  }
  if (or.length === 0) return null;

  const where = { OR: or };
  if (excludeClaimId) {
    where.id = { not: excludeClaimId };
  }
  return prisma.claim.findFirst({ where, select: { id: true, claimNumber: true, assignmentNumber: true } });
}

// ============================================================================
// Upload & Preview
// ============================================================================

export async function uploadWorkbook(file, importedBy) {
  ensureImportDir();
  if (!file) throw new AppError('No file uploaded', 400);

  const hash = fileHash(file.path);
  const existing = await prisma.claimImportBatch.findFirst({
    where: { fileHash: hash, status: { notIn: ['ROLLED_BACK'] } },
    select: { id: true, status: true, fileName: true },
  });
  if (existing) {
    throw new AppError(`A batch with this file already exists (batch #${existing.id}, status: ${existing.status})`, 409);
  }

  const batch = await prisma.claimImportBatch.create({
    data: {
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileHash: hash,
      status: 'UPLOADED',
      importedById: importedBy,
    },
  });

  await logAction('IMPORT_UPLOADED', 'ClaimImportBatch', batch.id, importedBy, { fileName: file.originalname });
  return { id: batch.id, fileName: batch.fileName, status: batch.status };
}

// Parse the workbook and return a preview without persisting rows.
export async function previewWorkbook(batchId, importedBy) {
  const batch = await prisma.claimImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new AppError('Import batch not found', 404);
  if (batch.status !== 'UPLOADED') {
    throw new AppError(`Batch is in ${batch.status} state, cannot preview`, 400);
  }

  const fileBuffer = fs.readFileSync(batch.filePath);
  const result = await parseClaimWorkbook(fileBuffer);

  const totalRows = result.rows.length;
  const issuesCount = result.rows.reduce((sum, r) => sum + (r.issues?.length || 0), 0);

  await prisma.claimImportBatch.update({
    where: { id: batchId },
    data: {
      status: 'PARSED',
      sourceSheets: result.sheets.map((s) => ({ name: s.name, rowCount: s.rowCount })),
      totalRows,
    },
  });

  await logAction('IMPORT_PREVIEWED', 'ClaimImportBatch', batchId, importedBy, {
    totalRows,
    sheets: result.sheets.map((s) => s.name),
  });

  return {
    batchId,
    sheets: result.sheets,
    totalRows,
    issuesCount,
    lowStatusCount: result.rows.filter((r) => r.statusConfidence === 'LOW').length,
    // Return first 20 rows as a sample preview
    sampleRows: result.rows.slice(0, 20).map((r) => ({
      sourceSheet: r.sourceSheet,
      sourceRowNumber: r.sourceRow,
      mappedData: {
        claimNumber: r.ocsReference,
        assignmentNumber: r.itemNumber,
        insuredName: r.insuredName,
        insurerClaimNumber: r.insurerClaimNumber,
        dateOfLoss: r.dateOfLoss,
        claimedAmount: r.claimedAmount,
        claimedAmountRaw: r.claimedAmountRaw,
        natureOfLoss: r.natureOfLoss,
        locationOfLoss: r.locationOfLoss,
        remarks: r.remarks,
        latestStatus: r.latestStatus,
        brokerRaw: r.brokerRaw,
        assignedBy: r.assignedBy,
      },
      inferredStatus: r.suggestedProcessStatus,
      statusConfidence: r.statusConfidence,
      issues: r.issues,
    })),
  };
}

// ============================================================================
// Persist parsed rows for validation/review
// ============================================================================

export async function persistRows(batchId, importedBy) {
  const batch = await prisma.claimImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new AppError('Import batch not found', 404);
  if (batch.status !== 'PARSED') {
    throw new AppError(`Batch is in ${batch.status} state, must be PARSED to persist rows`, 400);
  }

  const fileBuffer = fs.readFileSync(batch.filePath);
  const result = await parseClaimWorkbook(fileBuffer);

  let accepted = 0;
  let flagged = 0;

  for (const row of result.rows) {
    const hasIssues = row.issues && row.issues.length > 0;
    const status = hasIssues ? 'FLAGGED' : 'ACCEPTED';
    if (hasIssues) flagged++;
    else accepted++;

    // Map parser row to the structure expected by buildClaimDataFromMappedRow
    const mappedData = {
      claimNumber: row.ocsReference,
      assignmentNumber: row.itemNumber,
      insuredName: row.insuredName,
      insurerClaimNumber: row.insurerClaimNumber,
      dateOfLoss: row.dateOfLoss,
      claimedAmount: row.claimedAmount,
      claimedAmountRaw: row.claimedAmountRaw,
      natureOfLoss: row.natureOfLoss,
      locationOfLoss: row.locationOfLoss,
      remarks: row.remarks,
      latestStatus: row.latestStatus,
      brokerRaw: row.brokerRaw,
      assignedBy: row.assignedBy,
    };

    await prisma.claimImportRow.create({
      data: {
        importBatchId: batchId,
        sourceSheet: row.sourceSheet,
        sourceRowNumber: row.sourceRow,
        rawData: row.rawData,
        mappedData,
        status,
        confidence: row.statusConfidence || null,
        inferredStatus: row.suggestedProcessStatus || null,
        issues: row.issues || null,
      },
    });
  }

  await prisma.claimImportBatch.update({
    where: { id: batchId },
    data: { status: 'PERSISTED', acceptedRows: accepted, flaggedRows: flagged },
  });

  await logAction('IMPORT_PERSISTED', 'ClaimImportBatch', batchId, importedBy, {
    accepted,
    flagged,
    total: result.rows.length,
  });

  return { batchId, acceptedRows: accepted, flaggedRows: flagged, totalRows: result.rows.length };
}

// ============================================================================
// List batches and rows
// ============================================================================

export async function getBatches(filters = {}) {
  const { status, page = 1, limit = 25 } = filters;
  const where = {};
  if (status) where.status = status;

  const [items, count] = await Promise.all([
    prisma.claimImportBatch.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        importedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.claimImportBatch.count({ where }),
  ]);

  return {
    items: items.map((b) => ({
      id: b.id,
      fileName: b.fileName,
      status: b.status,
      totalRows: b.totalRows,
      acceptedRows: b.acceptedRows,
      flaggedRows: b.flaggedRows,
      committedRows: b.committedRows,
      committedAt: b.committedAt?.toISOString(),
      rolledBackAt: b.rolledBackAt?.toISOString(),
      importedBy: b.importedBy ? `${b.importedBy.firstName} ${b.importedBy.lastName}` : null,
      createdAt: b.createdAt.toISOString(),
    })),
    count,
    page: Number(page),
    limit: Number(limit),
  };
}

export async function getBatch(batchId) {
  const batch = await prisma.claimImportBatch.findUnique({
    where: { id: batchId },
    include: {
      importedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!batch) throw new AppError('Import batch not found', 404);

  return {
    id: batch.id,
    fileName: batch.fileName,
    status: batch.status,
    sourceSheets: batch.sourceSheets,
    headerMapping: batch.headerMapping,
    duplicateAction: batch.duplicateAction,
    totalRows: batch.totalRows,
    acceptedRows: batch.acceptedRows,
    flaggedRows: batch.flaggedRows,
    committedRows: batch.committedRows,
    committedAt: batch.committedAt?.toISOString(),
    rolledBackAt: batch.rolledBackAt?.toISOString(),
    notes: batch.notes,
    importedBy: batch.importedBy ? `${batch.importedBy.firstName} ${batch.importedBy.lastName}` : null,
    createdAt: batch.createdAt.toISOString(),
  };
}

export async function getBatchRows(batchId, filters = {}) {
  const { status, page = 1, limit = 50 } = filters;
  const where = { importBatchId: batchId };
  if (status) where.status = status;

  const [items, count] = await Promise.all([
    prisma.claimImportRow.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: [{ sourceSheet: 'asc' }, { sourceRowNumber: 'asc' }],
    }),
    prisma.claimImportRow.count({ where }),
  ]);

  return {
    items: items.map((r) => ({
      id: r.id,
      sourceSheet: r.sourceSheet,
      sourceRowNumber: r.sourceRowNumber,
      status: r.status,
      confidence: r.confidence,
      inferredStatus: r.inferredStatus,
      issues: r.issues,
      mappedData: r.mappedData,
      duplicateOfClaimId: r.duplicateOfClaimId,
      committedAt: r.committedAt?.toISOString(),
      rolledBackAt: r.rolledBackAt?.toISOString(),
    })),
    count,
    page: Number(page),
    limit: Number(limit),
  };
}

// ============================================================================
// Update header mapping (Admin can override auto-detected mapping)
// ============================================================================

export async function updateMapping(batchId, headerMapping, importedBy) {
  const batch = await prisma.claimImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new AppError('Import batch not found', 404);
  if (!['PARSED', 'PERSISTED'].includes(batch.status)) {
    throw new AppError(`Batch is in ${batch.status} state, cannot update mapping`, 400);
  }

  await prisma.claimImportBatch.update({
    where: { id: batchId },
    data: { headerMapping },
  });

  await logAction('IMPORT_MAPPING_UPDATED', 'ClaimImportBatch', batchId, importedBy, {});
  return { batchId, headerMapping };
}

// ============================================================================
// Commit: create claims from accepted rows
// ============================================================================

export async function commitBatch(batchId, importedBy, options = {}) {
  const batch = await prisma.claimImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new AppError('Import batch not found', 404);
  if (!['PERSISTED'].includes(batch.status)) {
    throw new AppError(`Batch is in ${batch.status} state, must be PERSISTED to commit`, 400);
  }

  const { duplicateAction = 'SKIP' } = options;

  // Load context for claim creation
  const [defaultStatus, defaultProcessStatus, allProcessStatuses] = await Promise.all([
    prisma.claimStatus.findFirst({ where: { code: 'NEW' } }),
    prisma.processStatus.findFirst({ where: { code: 'RECEIVED' } }),
    prisma.processStatus.findMany(),
  ]);

  if (!defaultStatus) throw new AppError('Default claim status not found', 500);
  if (!defaultProcessStatus) throw new AppError('Default process status not found', 500);

  const context = {
    importedById: importedBy,
    defaultStatusId: defaultStatus.id,
    defaultProcessStatusId: defaultProcessStatus.id,
    processStatusByCode: Object.fromEntries(allProcessStatuses.map((p) => [p.code, p])),
  };

  const rows = await prisma.claimImportRow.findMany({
    where: {
      importBatchId: batchId,
      status: { in: ['ACCEPTED', 'FLAGGED'] },
    },
    orderBy: [{ sourceSheet: 'asc' }, { sourceRowNumber: 'asc' }],
  });

  let committed = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const row of rows) {
    try {
      // Check for duplicates
      const dup = await findDuplicate(row.mappedData);
      if (dup) {
        if (duplicateAction === 'SKIP') {
          await prisma.claimImportRow.update({
            where: { id: row.id },
            data: { status: 'DUPLICATE', duplicateOfClaimId: dup.id },
          });
          skipped++;
          continue;
        }
        // For OVERWRITE, we'd need more complex logic — skip for now
        await prisma.claimImportRow.update({
          where: { id: row.id },
          data: { status: 'DUPLICATE', duplicateOfClaimId: dup.id },
        });
        skipped++;
        continue;
      }

      // Require a claimNumber for committed claims
      if (!row.mappedData?.claimNumber) {
        await prisma.claimImportRow.update({
          where: { id: row.id },
          data: { status: 'REJECTED' },
        });
        skipped++;
        continue;
      }

      const claimData = buildClaimDataFromMappedRow(row, context);
      claimData.importBatchId = batchId;
      claimData.importRowId = row.id;

      const claim = await prisma.claim.create({ data: claimData });

      // Record initial process status history
      if (claim.processStatusId) {
        await prisma.claimProcessStatusHistory.create({
          data: {
            claimId: claim.id,
            processStatusId: claim.processStatusId,
            changedById: importedBy,
            notes: 'Imported from workbook',
            source: 'IMPORT',
          },
        });
      }

      // Record initial status history
      await prisma.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          statusId: claim.statusId,
          changedById: importedBy,
          notes: 'Imported from workbook',
        },
      });

      // Link the row to the committed claim
      await prisma.claimImportRow.update({
        where: { id: row.id },
        data: { status: 'COMMITTED', committedAt: new Date() },
      });

      committed++;
    } catch (err) {
      errors++;
      errorDetails.push({
        rowId: row.id,
        sourceSheet: row.sourceSheet,
        sourceRowNumber: row.sourceRowNumber,
        error: err.message,
      });
      await prisma.claimImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR' },
      });
    }
  }

  await prisma.claimImportBatch.update({
    where: { id: batchId },
    data: {
      status: 'COMMITTED',
      committedRows: committed,
      committedAt: new Date(),
      duplicateAction,
    },
  });

  await logAction('IMPORT_COMMITTED', 'ClaimImportBatch', batchId, importedBy, {
    committed,
    skipped,
    errors,
  });

  return { batchId, committed, skipped, errors, errorDetails: errorDetails.length > 0 ? errorDetails : undefined };
}

// ============================================================================
// Rollback: delete claims created from a committed batch
// ============================================================================

export async function rollbackBatch(batchId, importedBy) {
  const batch = await prisma.claimImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new AppError('Import batch not found', 404);
  if (batch.status !== 'COMMITTED') {
    throw new AppError(`Batch is in ${batch.status} state, must be COMMITTED to rollback`, 400);
  }

  // Find all claims created from this batch
  const claims = await prisma.claim.findMany({
    where: { importBatchId: batchId },
    select: { id: true, claimNumber: true },
  });

  // Delete claims (cascade will handle related records)
  for (const claim of claims) {
    await prisma.claim.delete({ where: { id: claim.id } });
  }

  // Mark all rows as rolled back
  await prisma.claimImportRow.updateMany({
    where: { importBatchId: batchId, status: 'COMMITTED' },
    data: { status: 'ROLLED_BACK', rolledBackAt: new Date() },
  });

  await prisma.claimImportBatch.update({
    where: { id: batchId },
    data: { status: 'ROLLED_BACK', rolledBackAt: new Date() },
  });

  await logAction('IMPORT_ROLLED_BACK', 'ClaimImportBatch', batchId, importedBy, {
    claimsDeleted: claims.length,
  });

  return { batchId, claimsDeleted: claims.length };
}
