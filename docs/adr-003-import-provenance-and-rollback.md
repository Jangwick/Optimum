# ADR-003: Import Provenance and Rollback

## Status
Accepted

## Context
Legacy claims data is stored in an Excel workbook with multiple sheets (one per assignment year). The workbook contains:
- Unnormalized text values (insurer names, broker names, status text)
- Multi-insurer panels per claim
- Historical activity and correspondence
- Uncertain or incomplete records

A direct import would lose provenance and make it impossible to trace imported values back to their source or to roll back a bad import.

## Decision
Implement a **batch-based import system with full provenance**:

1. **ClaimImportBatch**: Records each upload with file hash, path, size, status, and timestamps. File hash dedup prevents re-importing the same file.

2. **ClaimImportRow**: One per parsed workbook row. Stores:
   - `rawData`: The original cell values
   - `mappedData`: Normalized values mapped to canonical fields
   - `status`: ACCEPTED, FLAGGED, DUPLICATE, COMMITTED, ERROR, REJECTED, ROLLED_BACK
   - `inferredStatus`: The process status inferred from status text
   - `confidence`: HIGH/MEDIUM/LOW confidence in the inference
   - `issues`: Array of validation issues
   - `duplicateOfClaimId`: Reference to existing claim if duplicate detected
   - `committedAt` / `rolledBackAt`: Timestamps for audit

3. **Claim** has `importBatchId` and `importRowId` fields linking back to the source.

4. **Raw values** are preserved alongside normalized values (`claimedAmountRaw`, `reserveRaw`, `proposedSettlementRaw`, `agreedSettlementRaw`, `remarksRaw`, `latestStatusRaw`, `letterFollowUpRaw`).

5. **Rollback**: Deleting all claims created from a batch cascades to related records (status history, process history, activities, etc.) via Prisma cascade rules.

6. **Import lifecycle**: UPLOADED → PARSED → PERSISTED → COMMITTED → (optionally ROLLED_BACK)

## Consequences
- Import batches and rows accumulate and should be archived periodically
- Raw values consume additional storage but provide auditability
- Rollback is destructive (deletes claims) and should be used carefully
- Future imports can reference prior batches to detect duplicates across batches

## Implementation
- `import.service.js`: Upload, preview, persist, commit, rollback
- Routes: `/api/imports` (Admin-only)
- UI: Import Wizard with 4-step flow
- Tests: `import.test.js` covering full lifecycle
