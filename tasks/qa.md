# Manual QA Checklist

## Auth & RBAC
- [ ] Login as admin, engineer, accountant.
- [ ] Cross-role API access is blocked.
- [ ] Admin can manage users.

## Claim lifecycle
- [ ] Create client, insurance company, policy.
- [ ] Create claim from policy.
- [ ] Assign engineer and accountant.
- [ ] Move claim through status workflow.
- [ ] View status history.

## Investigation & documents
- [ ] Add investigation and contacts.
- [ ] Schedule inspection.
- [ ] Upload documents by category and mark received.
- [ ] Download documents.

## Assessment & reports
- [ ] Create loss assessment with line items.
- [ ] Generate PDF report.
- [ ] Submit clarification and answer.

## Settlement & fees
- [ ] Record settlement and offers.
- [ ] Add fees, generate invoice.
- [ ] Record payment and see invoice paid.

## Dashboard & admin
- [ ] Dashboard shows role-scoped KPIs.
- [ ] Admin can view audit logs.

## Build & deploy
- [ ] `npm run lint`, `npm run build`, `npm run dev` pass.
- [ ] `npm start` runs in production.
- [ ] MySQL backup script runs.
