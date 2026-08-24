-- Fix schema drift between the current migrations and prisma/schema.prisma.
-- Generated from `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`.

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY `claims_claimTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY `claims_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `claims` DROP FOREIGN KEY `claims_insuranceCompanyId_fkey`;

-- DropIndex
DROP INDEX `claims_claimTypeId_fkey` ON `claims`;

-- AlterTable
ALTER TABLE `claim_insurers` MODIFY `proposedSettlement` DECIMAL(18, 2) NULL,
    MODIFY `agreedSettlement` DECIMAL(18, 2) NULL,
    MODIFY `paidAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `claims` ADD COLUMN `agreedSettlement` DECIMAL(18, 2) NULL,
    MODIFY `claimTypeId` INTEGER NULL,
    MODIFY `clientId` INTEGER NULL,
    MODIFY `insuranceCompanyId` INTEGER NULL,
    MODIFY `reserve` DECIMAL(18, 2) NULL,
    MODIFY `estimatedLoss` DECIMAL(18, 2) NULL,
    MODIFY `actualLoss` DECIMAL(18, 2) NULL,
    MODIFY `deductible` DECIMAL(18, 2) NULL,
    MODIFY `depreciation` DECIMAL(18, 2) NULL,
    MODIFY `adjustedLoss` DECIMAL(18, 2) NULL,
    MODIFY `claimedAmount` DECIMAL(18, 2) NULL,
    MODIFY `proposedSettlement` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `clients` ADD COLUMN `code` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `documents` ADD COLUMN `data` LONGBLOB NULL;

-- AlterTable
ALTER TABLE `fees` MODIFY `amount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `inspection_photos` ADD COLUMN `data` LONGBLOB NULL;

-- AlterTable
ALTER TABLE `insurance_companies` ADD COLUMN `code` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `invoices` MODIFY `totalAmount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `loss_assessment_items` MODIFY `unitCost` DECIMAL(18, 2) NULL,
    MODIFY `amount` DECIMAL(18, 2) NULL,
    MODIFY `depreciation` DECIMAL(18, 2) NULL,
    MODIFY `deductible` DECIMAL(18, 2) NULL,
    MODIFY `adjustedAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `loss_assessments` MODIFY `totalAmount` DECIMAL(18, 2) NULL,
    MODIFY `depreciation` DECIMAL(18, 2) NULL,
    MODIFY `deductible` DECIMAL(18, 2) NULL,
    MODIFY `adjustedAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `loss_estimates` MODIFY `totalAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `offers` MODIFY `offeredAmount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `payments` MODIFY `amount` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `policies` ADD COLUMN `claimTypeId` INTEGER NOT NULL,
    ADD COLUMN `excess` DECIMAL(18, 2) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `policyType` VARCHAR(100) NULL,
    ADD COLUMN `sumInsured` DECIMAL(18, 2) NULL,
    MODIFY `premium` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `settlements` MODIFY `settledAmount` DECIMAL(18, 2) NULL;

-- CreateTable
CREATE TABLE `discussion_notes` (
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
CREATE UNIQUE INDEX `clients_code_key` ON `clients`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `insurance_companies_code_key` ON `insurance_companies`(`code`);

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discussion_notes` ADD CONSTRAINT `discussion_notes_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
