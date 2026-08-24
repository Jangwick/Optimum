-- Fix schema drift between the current migrations and prisma/schema.prisma.
-- Generated from `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`.

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY IF EXISTS `claims_claimTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY IF EXISTS `claims_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY IF EXISTS `claims_insuranceCompanyId_fkey`;

-- DropIndex
DROP INDEX IF EXISTS `claims_claimTypeId_fkey` ON `claims`;

-- AlterTable
ALTER TABLE `claim_insurers` MODIFY IF EXISTS `proposedSettlement` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `agreedSettlement` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `paidAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `claims` ADD COLUMN IF NOT EXISTS `agreedSettlement` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `claimTypeId` INTEGER NULL,
    MODIFY IF EXISTS `clientId` INTEGER NULL,
    MODIFY IF EXISTS `insuranceCompanyId` INTEGER NULL,
    MODIFY IF EXISTS `reserve` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `estimatedLoss` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `actualLoss` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `deductible` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `depreciation` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `adjustedLoss` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `claimedAmount` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `proposedSettlement` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `code` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `documents` ADD COLUMN IF NOT EXISTS `data` LONGBLOB NULL;

-- AlterTable
ALTER TABLE `fees` MODIFY IF EXISTS `amount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `inspection_photos` ADD COLUMN IF NOT EXISTS `data` LONGBLOB NULL;

-- AlterTable
ALTER TABLE `insurance_companies` ADD COLUMN IF NOT EXISTS `code` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `invoices` MODIFY IF EXISTS `totalAmount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `loss_assessment_items` MODIFY IF EXISTS `unitCost` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `amount` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `depreciation` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `deductible` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `adjustedAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `loss_assessments` MODIFY IF EXISTS `totalAmount` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `depreciation` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `deductible` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `adjustedAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `loss_estimates` MODIFY IF EXISTS `totalAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `offers` MODIFY IF EXISTS `offeredAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `payments` MODIFY IF EXISTS `amount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `policies` ADD COLUMN IF NOT EXISTS `claimTypeId` INTEGER NOT NULL,
    ADD COLUMN IF NOT EXISTS `excess` DECIMAL(18, 2) NULL,
    ADD COLUMN IF NOT EXISTS `notes` TEXT NULL,
    ADD COLUMN IF NOT EXISTS `policyType` VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS `sumInsured` DECIMAL(18, 2) NULL,
    MODIFY IF EXISTS `premium` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `settlements` MODIFY IF EXISTS `settledAmount` DECIMAL(18, 2) NULL;

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS `clients_code_key` ON `clients`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS `insurance_companies_code_key` ON `insurance_companies`(`code`);

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_claimTypeId_fkey` FOREIGN KEY IF NOT EXISTS (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_claimTypeId_fkey` FOREIGN KEY IF NOT EXISTS (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_clientId_fkey` FOREIGN KEY IF NOT EXISTS (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_insuranceCompanyId_fkey` FOREIGN KEY IF NOT EXISTS (`insuranceCompanyId`) REFERENCES `insurance_companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_claimId_fkey` FOREIGN KEY IF NOT EXISTS (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_createdById_fkey` FOREIGN KEY IF NOT EXISTS (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
