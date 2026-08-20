-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `employeeNumber` VARCHAR(50) NULL,
    `department` VARCHAR(100) NULL,
    `designation` VARCHAR(100) NULL,
    `roleId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_employeeNumber_key`(`employeeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insurance_companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `contactPerson` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `contactPerson` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `policies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `policyNumber` VARCHAR(100) NOT NULL,
    `insuranceCompanyId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `coverageDetails` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `premium` DECIMAL(15, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `policies_policyNumber_key`(`policyNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `claim_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `color` VARCHAR(20) NULL,
    `isTerminal` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `claim_statuses_name_key`(`name`),
    UNIQUE INDEX `claim_statuses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claims` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimNumber` VARCHAR(100) NOT NULL,
    `assignmentNumber` VARCHAR(100) NULL,
    `claimTypeId` INTEGER NOT NULL,
    `policyId` INTEGER NULL,
    `clientId` INTEGER NOT NULL,
    `insuranceCompanyId` INTEGER NOT NULL,
    `engineerId` INTEGER NULL,
    `accountantId` INTEGER NULL,
    `statusId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `closedById` INTEGER NULL,
    `dateOfLoss` DATETIME(3) NULL,
    `dateReceived` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` TEXT NULL,
    `reserve` DECIMAL(15, 2) NULL,
    `estimatedLoss` DECIMAL(15, 2) NULL,
    `actualLoss` DECIMAL(15, 2) NULL,
    `deductible` DECIMAL(15, 2) NULL,
    `depreciation` DECIMAL(15, 2) NULL,
    `adjustedLoss` DECIMAL(15, 2) NULL,
    `classification` VARCHAR(50) NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `claims_claimNumber_key`(`claimNumber`),
    UNIQUE INDEX `claims_assignmentNumber_key`(`assignmentNumber`),
    INDEX `claims_statusId_idx`(`statusId`),
    INDEX `claims_engineerId_idx`(`engineerId`),
    INDEX `claims_accountantId_idx`(`accountantId`),
    INDEX `claims_clientId_idx`(`clientId`),
    INDEX `claims_insuranceCompanyId_idx`(`insuranceCompanyId`),
    INDEX `claims_claimNumber_idx`(`claimNumber`),
    INDEX `claims_dateReceived_idx`(`dateReceived`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unassignedAt` DATETIME(3) NULL,
    `assignedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `statusId` INTEGER NOT NULL,
    `changedById` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investigations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `summary` TEXT NULL,
    `findings` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `completedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `role` VARCHAR(100) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `conductedAt` DATETIME(3) NULL,
    `location` VARCHAR(255) NULL,
    `findings` TEXT NULL,
    `notes` TEXT NULL,
    `inspectorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspection_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inspectionId` INTEGER NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `size` INTEGER NOT NULL,
    `caption` VARCHAR(255) NULL,
    `uploadedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_categories_name_key`(`name`),
    UNIQUE INDEX `document_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_requirements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimTypeId` INTEGER NOT NULL,
    `documentCategoryId` INTEGER NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_requirements_claimTypeId_documentCategoryId_key`(`claimTypeId`, `documentCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `documentCategoryId` INTEGER NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `size` INTEGER NOT NULL,
    `description` TEXT NULL,
    `uploadedById` INTEGER NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `isReceived` BOOLEAN NOT NULL DEFAULT false,
    `receivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loss_assessments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `preparedById` INTEGER NOT NULL,
    `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalAmount` DECIMAL(15, 2) NULL,
    `depreciation` DECIMAL(15, 2) NULL,
    `deductible` DECIMAL(15, 2) NULL,
    `adjustedAmount` DECIMAL(15, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loss_assessment_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lossAssessmentId` INTEGER NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitCost` DECIMAL(15, 2) NULL,
    `amount` DECIMAL(15, 2) NULL,
    `depreciation` DECIMAL(15, 2) NULL,
    `deductible` DECIMAL(15, 2) NULL,
    `adjustedAmount` DECIMAL(15, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loss_estimates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `preparedById` INTEGER NOT NULL,
    `estimateDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalAmount` DECIMAL(15, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `fileName` VARCHAR(255) NULL,
    `path` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `reportTemplateId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `generatedAt` DATETIME(3) NULL,
    `generatedById` INTEGER NULL,
    `docxPath` VARCHAR(500) NULL,
    `pdfPath` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `docxPath` VARCHAR(500) NULL,
    `pdfPath` VARCHAR(500) NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `generatedById` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clarifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NULL,
    `askedById` INTEGER NOT NULL,
    `answeredById` INTEGER NULL,
    `askedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `answeredAt` DATETIME(3) NULL,
    `status` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settlements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `settlementDate` DATETIME(3) NULL,
    `settledAmount` DECIMAL(15, 2) NULL,
    `status` VARCHAR(50) NOT NULL,
    `notes` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `offerDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `offeredAmount` DECIMAL(15, 2) NULL,
    `status` VARCHAR(50) NOT NULL,
    `responseDate` DATETIME(3) NULL,
    `responseById` INTEGER NULL,
    `notes` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `feeType` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` TEXT NULL,
    `isInvoiced` BOOLEAN NOT NULL DEFAULT false,
    `invoiceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NOT NULL,
    `invoiceNumber` VARCHAR(100) NOT NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `notes` TEXT NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(15, 2) NOT NULL,
    `method` VARCHAR(50) NULL,
    `reference` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claimId` INTEGER NULL,
    `assignedToId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` VARCHAR(50) NOT NULL,
    `priority` VARCHAR(20) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `claimId` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableName` VARCHAR(100) NOT NULL,
    `recordId` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `oldValues` JSON NULL,
    `newValues` JSON NULL,
    `userId` INTEGER NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `policies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_engineerId_fkey` FOREIGN KEY (`engineerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_accountantId_fkey` FOREIGN KEY (`accountantId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `claim_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_assignments` ADD CONSTRAINT `claim_assignments_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_assignments` ADD CONSTRAINT `claim_assignments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_assignments` ADD CONSTRAINT `claim_assignments_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_status_history` ADD CONSTRAINT `claim_status_history_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_status_history` ADD CONSTRAINT `claim_status_history_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `claim_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_status_history` ADD CONSTRAINT `claim_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investigations` ADD CONSTRAINT `investigations_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investigations` ADD CONSTRAINT `investigations_completedById_fkey` FOREIGN KEY (`completedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_inspectorId_fkey` FOREIGN KEY (`inspectorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_photos` ADD CONSTRAINT `inspection_photos_inspectionId_fkey` FOREIGN KEY (`inspectionId`) REFERENCES `inspections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_photos` ADD CONSTRAINT `inspection_photos_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_requirements` ADD CONSTRAINT `document_requirements_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_requirements` ADD CONSTRAINT `document_requirements_documentCategoryId_fkey` FOREIGN KEY (`documentCategoryId`) REFERENCES `document_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_documentCategoryId_fkey` FOREIGN KEY (`documentCategoryId`) REFERENCES `document_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loss_assessments` ADD CONSTRAINT `loss_assessments_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loss_assessments` ADD CONSTRAINT `loss_assessments_preparedById_fkey` FOREIGN KEY (`preparedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loss_assessment_items` ADD CONSTRAINT `loss_assessment_items_lossAssessmentId_fkey` FOREIGN KEY (`lossAssessmentId`) REFERENCES `loss_assessments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loss_estimates` ADD CONSTRAINT `loss_estimates_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loss_estimates` ADD CONSTRAINT `loss_estimates_preparedById_fkey` FOREIGN KEY (`preparedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reportTemplateId_fkey` FOREIGN KEY (`reportTemplateId`) REFERENCES `report_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_versions` ADD CONSTRAINT `report_versions_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_versions` ADD CONSTRAINT `report_versions_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clarifications` ADD CONSTRAINT `clarifications_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clarifications` ADD CONSTRAINT `clarifications_askedById_fkey` FOREIGN KEY (`askedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clarifications` ADD CONSTRAINT `clarifications_answeredById_fkey` FOREIGN KEY (`answeredById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settlements` ADD CONSTRAINT `settlements_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settlements` ADD CONSTRAINT `settlements_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_responseById_fkey` FOREIGN KEY (`responseById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fees` ADD CONSTRAINT `fees_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fees` ADD CONSTRAINT `fees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fees` ADD CONSTRAINT `fees_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
