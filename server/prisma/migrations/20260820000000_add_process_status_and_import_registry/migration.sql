-- Additive migration: process status, registry entities, import tracking.
-- All changes are additive (new tables, new nullable columns, new indexes).
-- Existing claims and IDs remain valid. Applied via `prisma db push` and
-- backfilled via `prisma db seed`. This file documents the DDL for provenance.
--
-- NOTE: This migration was created from the live database DDL after `db push`
-- because the development database had drift from earlier `db push` operations
-- that were not captured in migration files. To bring a fresh database up to
-- this state, run the init migration first, then this migration.

-- ============================================================================
-- New tables: registry entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS `process_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `color` varchar(20) DEFAULT NULL,
  `isTerminal` tinyint(1) NOT NULL DEFAULT '0',
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `process_statuses_name_key` (`name`),
  UNIQUE KEY `process_statuses_code_key` (`code`)
);

CREATE TABLE IF NOT EXISTS `brokers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `contactPerson` varchar(150) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brokers_code_key` (`code`)
);

CREATE TABLE IF NOT EXISTS `insurance_company_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) NOT NULL,
  `normalizedAlias` varchar(255) NOT NULL,
  `insuranceCompanyId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `insurance_company_aliases_alias_key` (`alias`),
  UNIQUE KEY `insurance_company_aliases_normalizedAlias_key` (`normalizedAlias`),
  KEY `insurance_company_aliases_insuranceCompanyId_fkey` (`insuranceCompanyId`),
  CONSTRAINT `insurance_company_aliases_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `client_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) NOT NULL,
  `normalizedAlias` varchar(255) NOT NULL,
  `clientId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_aliases_alias_key` (`alias`),
  UNIQUE KEY `client_aliases_normalizedAlias_key` (`normalizedAlias`),
  KEY `client_aliases_clientId_fkey` (`clientId`),
  CONSTRAINT `client_aliases_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `broker_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) NOT NULL,
  `normalizedAlias` varchar(255) NOT NULL,
  `brokerId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `broker_aliases_alias_key` (`alias`),
  UNIQUE KEY `broker_aliases_normalizedAlias_key` (`normalizedAlias`),
  KEY `broker_aliases_brokerId_fkey` (`brokerId`),
  CONSTRAINT `broker_aliases_brokerId_fkey` FOREIGN KEY (`brokerId`) REFERENCES `brokers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `adjuster_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alias` varchar(100) NOT NULL,
  `normalizedAlias` varchar(100) NOT NULL,
  `userId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `adjuster_aliases_alias_key` (`alias`),
  UNIQUE KEY `adjuster_aliases_normalizedAlias_key` (`normalizedAlias`),
  KEY `adjuster_aliases_userId_fkey` (`userId`),
  CONSTRAINT `adjuster_aliases_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `claim_type_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) NOT NULL,
  `normalizedAlias` varchar(255) NOT NULL,
  `claimTypeId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `claim_type_aliases_alias_key` (`alias`),
  UNIQUE KEY `claim_type_aliases_normalizedAlias_key` (`normalizedAlias`),
  KEY `claim_type_aliases_claimTypeId_fkey` (`claimTypeId`),
  CONSTRAINT `claim_type_aliases_claimTypeId_fkey` FOREIGN KEY (`claimTypeId`) REFERENCES `claim_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- New tables: import tracking (created before claim_activities/claim_correspondence
-- because claim_activities references claim_import_rows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `claim_import_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(500) NOT NULL,
  `fileSize` int DEFAULT NULL,
  `fileHash` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `sheetName` varchar(100) DEFAULT NULL,
  `sourceSheets` json DEFAULT NULL,
  `headerMapping` json DEFAULT NULL,
  `duplicateAction` varchar(20) DEFAULT NULL,
  `totalRows` int NOT NULL DEFAULT '0',
  `acceptedRows` int NOT NULL DEFAULT '0',
  `flaggedRows` int NOT NULL DEFAULT '0',
  `committedRows` int NOT NULL DEFAULT '0',
  `committedAt` datetime(3) DEFAULT NULL,
  `rolledBackAt` datetime(3) DEFAULT NULL,
  `notes` text,
  `importedById` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `claim_import_batches_status_idx` (`status`),
  KEY `claim_import_batches_importedById_idx` (`importedById`),
  CONSTRAINT `claim_import_batches_importedById_fkey` FOREIGN KEY (`importedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `claim_import_rows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `importBatchId` int NOT NULL,
  `sourceSheet` varchar(100) NOT NULL,
  `sourceRowNumber` int NOT NULL,
  `rawData` json NOT NULL,
  `mappedData` json DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `confidence` varchar(20) DEFAULT NULL,
  `inferredStatus` varchar(100) DEFAULT NULL,
  `issues` json DEFAULT NULL,
  `duplicateOfClaimId` int DEFAULT NULL,
  `committedAt` datetime(3) DEFAULT NULL,
  `rolledBackAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `claim_import_rows_importBatchId_idx` (`importBatchId`),
  KEY `claim_import_rows_status_idx` (`status`),
  KEY `claim_import_rows_duplicateOfClaimId_idx` (`duplicateOfClaimId`),
  CONSTRAINT `claim_import_rows_duplicateOfClaimId_fkey` FOREIGN KEY (`duplicateOfClaimId`) REFERENCES `claims` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `claim_import_rows_importBatchId_fkey` FOREIGN KEY (`importBatchId`) REFERENCES `claim_import_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- New tables: dual status history, insurer panels, activities, correspondence
-- ============================================================================

CREATE TABLE IF NOT EXISTS `claim_process_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimId` int NOT NULL,
  `processStatusId` int NOT NULL,
  `changedById` int NOT NULL,
  `notes` text,
  `source` varchar(30) NOT NULL DEFAULT 'USER',
  `isOverride` tinyint(1) NOT NULL DEFAULT '0',
  `overrideReason` text,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `claim_process_status_history_claimId_createdAt_idx` (`claimId`,`createdAt`),
  KEY `claim_process_status_history_processStatusId_fkey` (`processStatusId`),
  KEY `claim_process_status_history_changedById_fkey` (`changedById`),
  CONSTRAINT `claim_process_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `claim_process_status_history_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `claim_process_status_history_processStatusId_fkey` FOREIGN KEY (`processStatusId`) REFERENCES `process_statuses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `claim_insurers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimId` int NOT NULL,
  `insuranceCompanyId` int NOT NULL,
  `isLead` tinyint(1) NOT NULL DEFAULT '0',
  `participationPercent` decimal(5,2) DEFAULT NULL,
  `insurerClaimNumber` varchar(150) DEFAULT NULL,
  `proposedSettlement` decimal(15,2) DEFAULT NULL,
  `proposedSettlementRaw` text,
  `agreedSettlement` decimal(15,2) DEFAULT NULL,
  `agreedSettlementRaw` text,
  `paidAmount` decimal(15,2) DEFAULT NULL,
  `offerStatus` varchar(50) DEFAULT NULL,
  `paymentStatus` varchar(50) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `claim_insurers_claimId_idx` (`claimId`),
  KEY `claim_insurers_insuranceCompanyId_idx` (`insuranceCompanyId`),
  CONSTRAINT `claim_insurers_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `claim_insurers_insuranceCompanyId_fkey` FOREIGN KEY (`insuranceCompanyId`) REFERENCES `insurance_companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `claim_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimId` int NOT NULL,
  `activityType` varchar(50) NOT NULL,
  `occurredAt` datetime(3) DEFAULT NULL,
  `description` text NOT NULL,
  `source` varchar(20) NOT NULL DEFAULT 'USER',
  `sourceText` text,
  `confidence` varchar(20) DEFAULT NULL,
  `importRowId` int DEFAULT NULL,
  `actorId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `claim_activities_claimId_occurredAt_idx` (`claimId`,`occurredAt`),
  KEY `claim_activities_importRowId_fkey` (`importRowId`),
  KEY `claim_activities_actorId_fkey` (`actorId`),
  CONSTRAINT `claim_activities_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `claim_activities_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `claim_activities_importRowId_fkey` FOREIGN KEY (`importRowId`) REFERENCES `claim_import_rows` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `claim_correspondence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimId` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `sentAt` datetime(3) DEFAULT NULL,
  `receivedAt` datetime(3) DEFAULT NULL,
  `followUpDate` datetime(3) DEFAULT NULL,
  `recipient` varchar(255) DEFAULT NULL,
  `notes` text,
  `isHistorical` tinyint(1) NOT NULL DEFAULT '0',
  `documentId` int DEFAULT NULL,
  `createdById` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `claim_correspondence_claimId_idx` (`claimId`),
  KEY `claim_correspondence_documentId_fkey` (`documentId`),
  KEY `claim_correspondence_createdById_fkey` (`createdById`),
  CONSTRAINT `claim_correspondence_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `claims` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `claim_correspondence_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `claim_correspondence_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================================
-- Additive columns on existing tables
-- ============================================================================

-- claims: new nullable columns for registry, dual status, import tracking
ALTER TABLE `claims`
  ADD COLUMN IF NOT EXISTS `insurerClaimNumber` varchar(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `brokerId` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `brokerReference` varchar(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `processStatusId` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `importBatchId` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `importRowId` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `assignedByName` varchar(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `natureOfLoss` text,
  ADD COLUMN IF NOT EXISTS `locationOfLoss` text,
  ADD COLUMN IF NOT EXISTS `policyPeriodText` text,
  ADD COLUMN IF NOT EXISTS `policyCoverageText` text,
  ADD COLUMN IF NOT EXISTS `claimedAmount` decimal(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `claimedAmountRaw` text,
  ADD COLUMN IF NOT EXISTS `reserveRaw` text,
  ADD COLUMN IF NOT EXISTS `proposedSettlement` decimal(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `proposedSettlementRaw` text,
  ADD COLUMN IF NOT EXISTS `agreedSettlementRaw` text,
  ADD COLUMN IF NOT EXISTS `classification` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `remarksRaw` longtext,
  ADD COLUMN IF NOT EXISTS `latestStatusRaw` longtext,
  ADD COLUMN IF NOT EXISTS `letterFollowUpRaw` text,
  ADD COLUMN IF NOT EXISTS `isIncomplete` tinyint(1) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `incompleteReasons` json DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `importedAt` datetime(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `lastUserModifiedAt` datetime(3) DEFAULT NULL;

-- claims: new indexes and foreign keys
ALTER TABLE `claims`
  ADD UNIQUE KEY `claims_importRowId_key` (`importRowId`),
  ADD KEY `claims_processStatusId_idx` (`processStatusId`),
  ADD KEY `claims_brokerId_idx` (`brokerId`),
  ADD KEY `claims_importBatchId_idx` (`importBatchId`),
  ADD CONSTRAINT `claims_brokerId_fkey` FOREIGN KEY (`brokerId`) REFERENCES `brokers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `claims_processStatusId_fkey` FOREIGN KEY (`processStatusId`) REFERENCES `process_statuses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `claims_importBatchId_fkey` FOREIGN KEY (`importBatchId`) REFERENCES `claim_import_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `claims_importRowId_fkey` FOREIGN KEY (`importRowId`) REFERENCES `claim_import_rows` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- documents: new columns for historical/import provenance
ALTER TABLE `documents`
  ADD COLUMN IF NOT EXISTS `importBatchId` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `isHistorical` tinyint(1) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `source` varchar(20) NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS `sourceRowNumber` int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `sourceText` text;

ALTER TABLE `documents`
  ADD KEY `documents_importBatchId_idx` (`importBatchId`);

-- reports: new columns for historical/import provenance and milestones
ALTER TABLE `reports`
  ADD COLUMN IF NOT EXISTS `reportDate` datetime(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `clientResponseDate` datetime(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `submittedAt` datetime(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `revisedAt` datetime(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `isHistorical` tinyint(1) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `sourceText` text,
  ADD COLUMN IF NOT EXISTS `statusText` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `importBatchId` int DEFAULT NULL;

ALTER TABLE `reports`
  ADD KEY `reports_importBatchId_idx` (`importBatchId`);

-- ============================================================================
-- Seed data: OCS process statuses
-- ============================================================================
-- Process statuses are seeded via `prisma db seed`, which also backfills
-- `processStatusId` on existing claims using a conservative mapping from
-- the existing secondary ClaimStatus code to the closest OCS process stage.
