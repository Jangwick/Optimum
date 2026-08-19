# ADR-004: 18-Stage Primary Workflow + Historical Import Status

## Status
Accepted

## Context
ADR-001 introduced a dual status model with `ProcessStatus` (OCS 12-stage) as primary and `ClaimStatus` (internal) as secondary.

After deeper analysis of the actual Excel assignment registry and the operating process, the OCS 12-stage status was found to be a **historical/source status** rather than the true operational workflow. The actual operational workflow used by Claims Solutions has **18 stages** from new claim through closure.

The previous architecture had the relationship backwards: it treated the OCS 12-stage as primary and attempted to map the 18-stage workflow as secondary.

Additionally, the workbook contains **closed and cancelled sheets** that must be imported as full read-only historical records, not as editable active claims.

## Decision

### Three-tier status model

1. **ProcessStatus** (18-stage primary operational workflow):
   - `NEW_CLAIM` → `CLAIM_ASSIGNED` → `INITIAL_REVIEW` → `CONTACTED_INSURED` → `SITE_INSPECTION_SCHEDULED` → `UNDER_INVESTIGATION` → `INSPECTION_COMPLETED` → `DOCUMENTS_REQUIRED` → `DOCUMENTS_RECEIVED` → `LOSS_ASSESSMENT` → `RESERVE_LOSS_ESTIMATE_PREPARED` → `REPORT_PREPARATION` → `REPORT_SUBMITTED` → `CLIENT_REVIEW` → `FURTHER_CLARIFICATION` → `ADJUSTMENT_COMPLETED` → `CLAIM_SETTLED` → `CLAIM_CLOSED`
   - Used in: Claims lists, Claim detail, Dashboard counts, Filters, Status transitions, Import mapping, Exports
   - Has its own transition graph with role-aware permissions and closing/settlement guards

2. **ImportStatus** (12-stage historical OCS source status):
   - `AWAITING_DOCUMENTS`, `DOCUMENTS_UNDER_REVIEW`, `REPORT_UNDER_REVIEW`, `LETTER_REQUEST_UNDER_REVIEW`, `LETTER_AND_REPORT_UNDER_REVIEW`, `AWAITING_INSURER_INSTRUCTION`, `FOR_LETTER_OFFER`, `OFFER_DECLINED_REEVALUATION`, `FOR_CLOSING_AND_BILLING`, `FOR_CLOSING_WAIVED_BILLING`, `CLOSED`, `CANCELLED`
   - Read-only; visible in imported-record detail and import metadata
   - Not used for active workflow transitions

3. **ClaimStatus** (secondary internal status):
   - Retained for backward compatibility with existing service logic
   - Read-only or action-driven in user-facing views
   - Not the primary workflow transition graph

### Read-only historical records

- Imported closed sheet records: `isReadOnly = true`, `processStatus = CLAIM_CLOSED`, `importStatus = CLOSED`
- Imported cancelled sheet records: `isReadOnly = true`, `isCancelled = true`, `processStatus = CLAIM_CLOSED`, `importStatus = CANCELLED`
- Read-only records cannot be transitioned without Admin override + reason
- Read-only records display a banner in the claim detail UI

### Transition graph

The 18-stage transition graph enforces forward progression with Admin override capability. Key transitions:
- `NEW_CLAIM` → `CLAIM_ASSIGNED` → `INITIAL_REVIEW` → ...
- `CLIENT_REVIEW` ↔ `FURTHER_CLARIFICATION` (bidirectional)
- `ADJUSTMENT_COMPLETED` → `CLAIM_SETTLED` → `CLAIM_CLOSED`
- Any status → `CLAIM_CLOSED` (with guards)

### Closing guards
- Must have at least one submitted report (unless incomplete)
- All fees must be invoiced
- Incomplete claims require explicit override

### Settlement guards
- Must have at least one settlement or disposition on file (unless incomplete)

## Consequences

- **Schema**: Added `ImportStatus` model, `importStatusId`, `isReadOnly`, `isCancelled`, `cancellationReason` to Claim
- **Seed**: 18 ProcessStatuses + 12 ImportStatuses seeded; obsolete statuses cleaned up
- **Parser**: Infers both 18-stage primary and 12-stage historical status from workbook text and sheet type
- **Import service**: Persists both statuses, read-only flags, and cancellation metadata
- **Process status service**: 18-stage transition graph, closing/settlement guards, read-only enforcement
- **UI**: Claims registry uses 18-stage filter; Claim detail shows read-only banner, import status section, and 18-stage transition UI; Dashboard shows 18-stage breakdown
- **Registry consolidation**: `/registry` redirected to `/claims`; Registry sidebar entry removed
