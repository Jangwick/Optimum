-- CreateIndex
CREATE INDEX `claims_isClosed_idx` ON `claims`(`isClosed`);

-- CreateIndex
CREATE INDEX `claims_isCancelled_idx` ON `claims`(`isCancelled`);

-- CreateIndex
CREATE INDEX `claim_status_history_claimId_idx` ON `claim_status_history`(`claimId`);

-- CreateIndex
CREATE INDEX `inspections_claimId_idx` ON `inspections`(`claimId`);

-- CreateIndex
CREATE INDEX `inspections_conductedAt_idx` ON `inspections`(`conductedAt`);

-- CreateIndex
CREATE INDEX `inspections_scheduledAt_idx` ON `inspections`(`scheduledAt`);

-- CreateIndex
CREATE INDEX `settlements_claimId_idx` ON `settlements`(`claimId`);

-- CreateIndex
CREATE INDEX `offers_claimId_idx` ON `offers`(`claimId`);

-- CreateIndex
CREATE INDEX `offers_status_idx` ON `offers`(`status`);

-- CreateIndex
CREATE INDEX `fees_claimId_idx` ON `fees`(`claimId`);

-- CreateIndex
CREATE INDEX `invoices_claimId_idx` ON `invoices`(`claimId`);

-- CreateIndex
CREATE INDEX `tasks_assignedToId_idx` ON `tasks`(`assignedToId`);

-- CreateIndex
CREATE INDEX `tasks_claimId_idx` ON `tasks`(`claimId`);

-- CreateIndex
CREATE INDEX `tasks_status_idx` ON `tasks`(`status`);

-- CreateIndex
CREATE INDEX `notifications_claimId_idx` ON `notifications`(`claimId`);

-- CreateIndex
CREATE INDEX `notifications_userId_idx` ON `notifications`(`userId`);

-- CreateIndex
CREATE INDEX `notifications_isRead_idx` ON `notifications`(`isRead`);

-- CreateIndex
CREATE INDEX `audit_logs_userId_idx` ON `audit_logs`(`userId`);

-- CreateIndex
CREATE INDEX `audit_logs_createdAt_idx` ON `audit_logs`(`createdAt`);

