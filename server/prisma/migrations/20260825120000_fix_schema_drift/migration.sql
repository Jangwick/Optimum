-- Fix schema drift between the current migrations and prisma/schema.prisma.
-- Rewritten with MySQL 8 idempotent conditional DDL using PREPARE/EXECUTE.

-- DropForeignKey claims_claimTypeId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_claimTypeId_fkey') > 0,
  'ALTER TABLE `claims` DROP FOREIGN KEY `claims_claimTypeId_fkey`',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- DropForeignKey claims_clientId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_clientId_fkey') > 0,
  'ALTER TABLE `claims` DROP FOREIGN KEY `claims_clientId_fkey`',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- DropForeignKey claims_insuranceCompanyId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_insuranceCompanyId_fkey') > 0,
  'ALTER TABLE `claims` DROP FOREIGN KEY `claims_insuranceCompanyId_fkey`',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- DropIndex claims_claimTypeId_fkey on claims
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND INDEX_NAME = 'claims_claimTypeId_fkey') > 0,
  'DROP INDEX `claims_claimTypeId_fkey` ON `claims`',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify claim_insurers.proposedSettlement
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claim_insurers' AND COLUMN_NAME = 'proposedSettlement') > 0,
  'ALTER TABLE `claim_insurers` MODIFY `proposedSettlement` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claim_insurers.agreedSettlement
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claim_insurers' AND COLUMN_NAME = 'agreedSettlement') > 0,
  'ALTER TABLE `claim_insurers` MODIFY `agreedSettlement` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claim_insurers.paidAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claim_insurers' AND COLUMN_NAME = 'paidAmount') > 0,
  'ALTER TABLE `claim_insurers` MODIFY `paidAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn claims.agreedSettlement
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'agreedSettlement') = 0,
  'ALTER TABLE `claims` ADD COLUMN `agreedSettlement` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.claimTypeId
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'claimTypeId') > 0,
  'ALTER TABLE `claims` MODIFY `claimTypeId` INTEGER NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.clientId
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'clientId') > 0,
  'ALTER TABLE `claims` MODIFY `clientId` INTEGER NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.insuranceCompanyId
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'insuranceCompanyId') > 0,
  'ALTER TABLE `claims` MODIFY `insuranceCompanyId` INTEGER NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.reserve
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'reserve') > 0,
  'ALTER TABLE `claims` MODIFY `reserve` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.estimatedLoss
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'estimatedLoss') > 0,
  'ALTER TABLE `claims` MODIFY `estimatedLoss` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.actualLoss
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'actualLoss') > 0,
  'ALTER TABLE `claims` MODIFY `actualLoss` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.deductible
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'deductible') > 0,
  'ALTER TABLE `claims` MODIFY `deductible` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.depreciation
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'depreciation') > 0,
  'ALTER TABLE `claims` MODIFY `depreciation` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.adjustedLoss
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'adjustedLoss') > 0,
  'ALTER TABLE `claims` MODIFY `adjustedLoss` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.claimedAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'claimedAmount') > 0,
  'ALTER TABLE `claims` MODIFY `claimedAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify claims.proposedSettlement
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND COLUMN_NAME = 'proposedSettlement') > 0,
  'ALTER TABLE `claims` MODIFY `proposedSettlement` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn clients.code
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'code') = 0,
  'ALTER TABLE `clients` ADD COLUMN `code` VARCHAR(50) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn documents.data
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'data') = 0,
  'ALTER TABLE `documents` ADD COLUMN `data` LONGBLOB NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify fees.amount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fees' AND COLUMN_NAME = 'amount') > 0,
  'ALTER TABLE `fees` MODIFY `amount` DECIMAL(18, 2) NOT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn inspection_photos.data
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspection_photos' AND COLUMN_NAME = 'data') = 0,
  'ALTER TABLE `inspection_photos` ADD COLUMN `data` LONGBLOB NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn insurance_companies.code
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_companies' AND COLUMN_NAME = 'code') = 0,
  'ALTER TABLE `insurance_companies` ADD COLUMN `code` VARCHAR(50) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify invoices.totalAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'totalAmount') > 0,
  'ALTER TABLE `invoices` MODIFY `totalAmount` DECIMAL(18, 2) NOT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify loss_assessment_items.unitCost
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessment_items' AND COLUMN_NAME = 'unitCost') > 0,
  'ALTER TABLE `loss_assessment_items` MODIFY `unitCost` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessment_items.amount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessment_items' AND COLUMN_NAME = 'amount') > 0,
  'ALTER TABLE `loss_assessment_items` MODIFY `amount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessment_items.depreciation
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessment_items' AND COLUMN_NAME = 'depreciation') > 0,
  'ALTER TABLE `loss_assessment_items` MODIFY `depreciation` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessment_items.deductible
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessment_items' AND COLUMN_NAME = 'deductible') > 0,
  'ALTER TABLE `loss_assessment_items` MODIFY `deductible` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessment_items.adjustedAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessment_items' AND COLUMN_NAME = 'adjustedAmount') > 0,
  'ALTER TABLE `loss_assessment_items` MODIFY `adjustedAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify loss_assessments.totalAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessments' AND COLUMN_NAME = 'totalAmount') > 0,
  'ALTER TABLE `loss_assessments` MODIFY `totalAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessments.depreciation
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessments' AND COLUMN_NAME = 'depreciation') > 0,
  'ALTER TABLE `loss_assessments` MODIFY `depreciation` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessments.deductible
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessments' AND COLUMN_NAME = 'deductible') > 0,
  'ALTER TABLE `loss_assessments` MODIFY `deductible` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify loss_assessments.adjustedAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_assessments' AND COLUMN_NAME = 'adjustedAmount') > 0,
  'ALTER TABLE `loss_assessments` MODIFY `adjustedAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify loss_estimates.totalAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loss_estimates' AND COLUMN_NAME = 'totalAmount') > 0,
  'ALTER TABLE `loss_estimates` MODIFY `totalAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify offers.offeredAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'offeredAmount') > 0,
  'ALTER TABLE `offers` MODIFY `offeredAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify payments.amount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'amount') > 0,
  'ALTER TABLE `payments` MODIFY `amount` DECIMAL(18, 2) NOT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddColumn policies.claimTypeId
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'claimTypeId') = 0,
  'ALTER TABLE `policies` ADD COLUMN `claimTypeId` INTEGER NOT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify policies.claimTypeId
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'claimTypeId') > 0,
  'ALTER TABLE `policies` MODIFY `claimTypeId` INTEGER NOT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AddColumn policies.excess
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'excess') = 0,
  'ALTER TABLE `policies` ADD COLUMN `excess` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AddColumn policies.notes
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'notes') = 0,
  'ALTER TABLE `policies` ADD COLUMN `notes` TEXT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AddColumn policies.policyType
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'policyType') = 0,
  'ALTER TABLE `policies` ADD COLUMN `policyType` VARCHAR(100) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AddColumn policies.sumInsured
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'sumInsured') = 0,
  'ALTER TABLE `policies` ADD COLUMN `sumInsured` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify policies.premium
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'premium') > 0,
  'ALTER TABLE `policies` MODIFY `premium` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Modify settlements.settledAmount
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settlements' AND COLUMN_NAME = 'settledAmount') > 0,
  'ALTER TABLE `settlements` MODIFY `settledAmount` DECIMAL(18, 2) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
CREATE TABLE IF NOT EXISTS `discussion_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `partyType` VARCHAR(50) NOT NULL,
    `partyName` VARCHAR(255) NULL,
    `discussedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NOT NULL,
    `nextAction` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `discussion_notes_claimId_discussedAt_idx`(`claimId`, `discussedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateIndex clients_code_key on clients
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND INDEX_NAME = 'clients_code_key') = 0,
  'CREATE UNIQUE INDEX `clients_code_key` ON `clients`(`code`)',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- CreateIndex insurance_companies_code_key on insurance_companies
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_companies' AND INDEX_NAME = 'insurance_companies_code_key') = 0,
  'CREATE UNIQUE INDEX `insurance_companies_code_key` ON `insurance_companies`(`code`)',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey policies_claimTypeId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND CONSTRAINT_NAME = 'policies_claimTypeId_fkey') = 0,
  'ALTER TABLE `policies` ADD CONSTRAINT `policies_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey claims_claimTypeId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_claimTypeId_fkey') = 0,
  'ALTER TABLE `claims` ADD CONSTRAINT `claims_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey claims_clientId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_clientId_fkey') = 0,
  'ALTER TABLE `claims` ADD CONSTRAINT `claims_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey claims_insuranceCompanyId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'claims' AND CONSTRAINT_NAME = 'claims_insuranceCompanyId_fkey') = 0,
  'ALTER TABLE `claims` ADD CONSTRAINT `claims_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey discussion_notes_claimId_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'discussion_notes' AND CONSTRAINT_NAME = 'discussion_notes_claimId_fkey') = 0,
  'ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- AddForeignKey discussion_notes_createdById_fkey
SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'discussion_notes' AND CONSTRAINT_NAME = 'discussion_notes_createdById_fkey') = 0,
  'ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
