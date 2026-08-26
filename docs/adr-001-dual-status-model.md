# ADR-001: Dual Status Model for Legacy Migration

## Status
Accepted

## Context
The existing Claims Solutions system used an internal `ClaimStatus` workflow with granular states (NEW, ASSIGNED, INVESTIGATION, INSPECTION_SCHEDULED, INSPECTION_COMPLETED, DOCUMENTS_PENDING, DOCUMENTS_RECEIVED, ASSESSMENT, REPORT_DRAFT, REPORT_SUBMITTED, CLIENT_REVIEW, CLARIFICATION_NEEDED, CLARIFICATION_PROVIDED, SETTLEMENT, OFFER_SENT, FEE_INVOICED, PAYMENT_RECEIVED, CLOSED).

The legacy Excel workbook and OCS process use a different, broader process status flow (RECEIVED, ASSIGNED, INVESTIGATION, INSPECTION, DOCUMENTS, ASSESSMENT, REPORT, CLIENT_REVIEW, CLARIFICATION, SETTLEMENT, CLOSED).

During migration, both status systems need to coexist:
- The internal status drives existing application behavior (notifications, fee tracking, etc.)
- The OCS process status is the primary status shown to users and used for registry/reporting

## Decision
Implement a **dual status model**:

1. **ProcessStatus** (primary): New model with OCS process codes. Exposed as the primary status in the UI, registry, and exports. Has its own transition rules, history, and closing guards.

2. **ClaimStatus** (secondary): Existing internal workflow status. Retained for backward compatibility with existing service logic, fee tracking, and notifications.

3. **New claims** are initialized with `RECEIVED` as the process status and `NEW` as the internal status.

4. **Process status transitions** are validated against a transition map and require Admin role. Closing requires guards (submitted report, settlement, fees) unless an Admin provides an override reason.

5. **Both statuses** are exposed in API responses. The UI shows both badges but prioritizes the process status.

6. **Imported claims** get their process status inferred from the workbook's `LATEST STATUS` and `REMARKS` columns using the status inference rules.

## Consequences
- Two status histories are maintained per claim
- Status changes may need to be made in both systems (currently independent)
- Future work should consider consolidating to a single status system once all internal logic migrates to use the process status

## Implementation
- `ProcessStatus` model with `code`, `name`, `color`, `isTerminal`, `sortOrder`
- `ClaimProcessStatusHistory` for audit trail
- `process-status.service.ts` with transition validation and closing guards
- Routes: `GET /api/process-statuses`, `PATCH /api/claims/:id/process-status`, `GET /api/claims/:id/process-status-history`, `GET /api/claims/:id/closing-guards`
