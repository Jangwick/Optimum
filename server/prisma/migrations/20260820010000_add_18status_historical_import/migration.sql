-- Additive migration: 18-stage primary workflow status, import status for
-- historical OCS 12-status, read-only/cancelled flags, and missing registry
-- fields on claims. All changes are additive (new table, new nullable columns,
-- new indexes). Existing claims remain valid.

-- ============================================================================
-- New table: import_statuses (read-only OCS 12-status for historical records)
-- ============================================================================

CREATE TABLE `import_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `import_statuses_name_key` (`name`),
  UNIQUE KEY `import_statuses_code_key` (`code`)
);

-- ============================================================================
-- Additive columns on claims: missing registry fields + historical flags
-- ============================================================================

ALTER TABLE `claims`
  ADD COLUMN `handlingAdjuster` varchar(100) DEFAULT NULL,
  ADD COLUMN `dateInspected` datetime(3) DEFAULT NULL,
  ADD COLUMN `letterRequestDate` datetime(3) DEFAULT NULL,
  ADD COLUMN `denialLetterDate` datetime(3) DEFAULT NULL,
  ADD COLUMN `contactRaw` text,
  ADD COLUMN `policyNumber` varchar(100) DEFAULT NULL,
  ADD COLUMN `policyType` varchar(100) DEFAULT NULL,
  ADD COLUMN `isCancelled` tinyint(1) NOT NULL DEFAULT '0',
  ADD COLUMN `isReadOnly` tinyint(1) NOT NULL DEFAULT '0',
  ADD COLUMN `cancellationReason` text,
  ADD COLUMN `importStatusId` int DEFAULT NULL;

ALTER TABLE `claims`
  ADD KEY `claims_importStatusId_idx` (`importStatusId`),
  ADD KEY `claims_isReadOnly_idx` (`isReadOnly`),
  ADD CONSTRAINT `claims_importStatusId_fkey` FOREIGN KEY (`importStatusId`) REFERENCES `import_statuses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Seed data: 18 primary workflow statuses replace the 12 OCS entries in
-- process_statuses. The 12 OCS codes are moved to import_statuses.
-- Seeded via `prisma db seed`.
-- ============================================================================
