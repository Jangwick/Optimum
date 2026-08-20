-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "employeeNumber" VARCHAR(50),
    "department" VARCHAR(100),
    "designation" VARCHAR(100),
    "roleId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "contactPerson" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "contactPerson" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" SERIAL NOT NULL,
    "policyNumber" VARCHAR(100) NOT NULL,
    "insuranceCompanyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "claimTypeId" INTEGER NOT NULL,
    "coverageDetails" TEXT,
    "policyType" VARCHAR(100),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sumInsured" DECIMAL(18,2),
    "premium" DECIMAL(18,2),
    "excess" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "import_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "contactPerson" VARCHAR(150),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_company_aliases" (
    "id" SERIAL NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "normalizedAlias" VARCHAR(255) NOT NULL,
    "insuranceCompanyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_company_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_aliases" (
    "id" SERIAL NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "normalizedAlias" VARCHAR(255) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_aliases" (
    "id" SERIAL NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "normalizedAlias" VARCHAR(255) NOT NULL,
    "brokerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjuster_aliases" (
    "id" SERIAL NOT NULL,
    "alias" VARCHAR(100) NOT NULL,
    "normalizedAlias" VARCHAR(100) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuster_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_type_aliases" (
    "id" SERIAL NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "normalizedAlias" VARCHAR(255) NOT NULL,
    "claimTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_type_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" SERIAL NOT NULL,
    "claimNumber" VARCHAR(100) NOT NULL,
    "assignmentNumber" VARCHAR(100),
    "insurerClaimNumber" VARCHAR(150),
    "claimTypeId" INTEGER,
    "policyId" INTEGER,
    "clientId" INTEGER,
    "insuranceCompanyId" INTEGER,
    "brokerId" INTEGER,
    "brokerReference" VARCHAR(150),
    "engineerId" INTEGER,
    "accountantId" INTEGER,
    "statusId" INTEGER NOT NULL,
    "processStatusId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "closedById" INTEGER,
    "importBatchId" INTEGER,
    "importRowId" INTEGER,
    "dateOfLoss" TIMESTAMP(3),
    "dateReceived" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByName" VARCHAR(150),
    "natureOfLoss" TEXT,
    "locationOfLoss" TEXT,
    "description" TEXT,
    "policyPeriodText" TEXT,
    "policyCoverageText" TEXT,
    "claimedAmount" DECIMAL(18,2),
    "claimedAmountRaw" TEXT,
    "reserve" DECIMAL(18,2),
    "reserveRaw" TEXT,
    "estimatedLoss" DECIMAL(18,2),
    "actualLoss" DECIMAL(18,2),
    "proposedSettlement" DECIMAL(18,2),
    "proposedSettlementRaw" TEXT,
    "agreedSettlement" DECIMAL(18,2),
    "agreedSettlementRaw" TEXT,
    "deductible" DECIMAL(18,2),
    "depreciation" DECIMAL(18,2),
    "adjustedLoss" DECIMAL(18,2),
    "classification" VARCHAR(50),
    "remarksRaw" TEXT,
    "latestStatusRaw" TEXT,
    "letterFollowUpRaw" TEXT,
    "handlingAdjuster" VARCHAR(100),
    "dateInspected" TIMESTAMP(3),
    "letterRequestDate" TIMESTAMP(3),
    "denialLetterDate" TIMESTAMP(3),
    "contactRaw" TEXT,
    "policyNumber" VARCHAR(100),
    "policyType" VARCHAR(100),
    "isIncomplete" BOOLEAN NOT NULL DEFAULT false,
    "incompleteReasons" JSONB,
    "importedAt" TIMESTAMP(3),
    "lastUserModifiedAt" TIMESTAMP(3),
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "importStatusId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_assignments" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "assignedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_status_history" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "changedById" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_process_status_history" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "processStatusId" INTEGER NOT NULL,
    "changedById" INTEGER NOT NULL,
    "notes" TEXT,
    "source" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_process_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "summary" TEXT,
    "findings" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(100),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_insurers" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "insuranceCompanyId" INTEGER NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "participationPercent" DECIMAL(5,2),
    "insurerClaimNumber" VARCHAR(150),
    "proposedSettlement" DECIMAL(18,2),
    "proposedSettlementRaw" TEXT,
    "agreedSettlement" DECIMAL(18,2),
    "agreedSettlementRaw" TEXT,
    "paidAmount" DECIMAL(18,2),
    "offerStatus" VARCHAR(50),
    "paymentStatus" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_activities" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "activityType" VARCHAR(50) NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "sourceText" TEXT,
    "confidence" VARCHAR(20),
    "importRowId" INTEGER,
    "actorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_correspondence" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "recipient" VARCHAR(255),
    "notes" TEXT,
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "documentId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_correspondence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "conductedAt" TIMESTAMP(3),
    "location" VARCHAR(255),
    "findings" TEXT,
    "notes" TEXT,
    "inspectorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_photos" (
    "id" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" VARCHAR(255),
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" SERIAL NOT NULL,
    "claimTypeId" INTEGER NOT NULL,
    "documentCategoryId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "documentCategoryId" INTEGER,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedById" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3),
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "importBatchId" INTEGER,
    "sourceText" TEXT,
    "sourceRowNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_assessments" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "preparedById" INTEGER NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(18,2),
    "depreciation" DECIMAL(18,2),
    "deductible" DECIMAL(18,2),
    "adjustedAmount" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_assessment_items" (
    "id" SERIAL NOT NULL,
    "lossAssessmentId" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(18,2),
    "amount" DECIMAL(18,2),
    "depreciation" DECIMAL(18,2),
    "deductible" DECIMAL(18,2),
    "adjustedAmount" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_estimates" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "preparedById" INTEGER NOT NULL,
    "estimateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "fileName" VARCHAR(255),
    "path" VARCHAR(500),
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "reportTemplateId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "generatedById" INTEGER,
    "docxPath" VARCHAR(500),
    "pdfPath" VARCHAR(500),
    "reportDate" TIMESTAMP(3),
    "clientResponseDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "revisedAt" TIMESTAMP(3),
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "sourceText" TEXT,
    "statusText" VARCHAR(100),
    "importBatchId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "docxPath" VARCHAR(500),
    "pdfPath" VARCHAR(500),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarifications" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "askedById" INTEGER NOT NULL,
    "answeredById" INTEGER,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clarifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "settledAmount" DECIMAL(18,2),
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "offerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offeredAmount" DECIMAL(18,2),
    "status" VARCHAR(50) NOT NULL,
    "responseDate" TIMESTAMP(3),
    "responseById" INTEGER,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "userId" INTEGER,
    "feeType" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "isInvoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" VARCHAR(50),
    "reference" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER,
    "assignedToId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "claimId" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tableName" VARCHAR(100) NOT NULL,
    "recordId" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" INTEGER,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_import_batches" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER,
    "fileHash" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,
    "sheetName" VARCHAR(100),
    "sourceSheets" JSONB,
    "headerMapping" JSONB,
    "duplicateAction" VARCHAR(20),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "acceptedRows" INTEGER NOT NULL DEFAULT 0,
    "flaggedRows" INTEGER NOT NULL DEFAULT 0,
    "committedRows" INTEGER NOT NULL DEFAULT 0,
    "committedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "notes" TEXT,
    "importedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_import_rows" (
    "id" SERIAL NOT NULL,
    "importBatchId" INTEGER NOT NULL,
    "sourceSheet" VARCHAR(100) NOT NULL,
    "sourceRowNumber" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "mappedData" JSONB,
    "status" VARCHAR(50) NOT NULL,
    "confidence" VARCHAR(20),
    "inferredStatus" VARCHAR(100),
    "issues" JSONB,
    "duplicateOfClaimId" INTEGER,
    "committedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeNumber_key" ON "users"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_code_key" ON "insurance_companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "policies_policyNumber_key" ON "policies"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "claim_types_code_key" ON "claim_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "claim_statuses_name_key" ON "claim_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "claim_statuses_code_key" ON "claim_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "process_statuses_name_key" ON "process_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "process_statuses_code_key" ON "process_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "import_statuses_name_key" ON "import_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "import_statuses_code_key" ON "import_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_code_key" ON "brokers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_company_aliases_alias_key" ON "insurance_company_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_company_aliases_normalizedAlias_key" ON "insurance_company_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "client_aliases_alias_key" ON "client_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "client_aliases_normalizedAlias_key" ON "client_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "broker_aliases_alias_key" ON "broker_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "broker_aliases_normalizedAlias_key" ON "broker_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "adjuster_aliases_alias_key" ON "adjuster_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "adjuster_aliases_normalizedAlias_key" ON "adjuster_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "claim_type_aliases_alias_key" ON "claim_type_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "claim_type_aliases_normalizedAlias_key" ON "claim_type_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "claims_claimNumber_key" ON "claims"("claimNumber");

-- CreateIndex
CREATE UNIQUE INDEX "claims_assignmentNumber_key" ON "claims"("assignmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "claims_importRowId_key" ON "claims"("importRowId");

-- CreateIndex
CREATE INDEX "claims_statusId_idx" ON "claims"("statusId");

-- CreateIndex
CREATE INDEX "claims_processStatusId_idx" ON "claims"("processStatusId");

-- CreateIndex
CREATE INDEX "claims_engineerId_idx" ON "claims"("engineerId");

-- CreateIndex
CREATE INDEX "claims_accountantId_idx" ON "claims"("accountantId");

-- CreateIndex
CREATE INDEX "claims_clientId_idx" ON "claims"("clientId");

-- CreateIndex
CREATE INDEX "claims_insuranceCompanyId_idx" ON "claims"("insuranceCompanyId");

-- CreateIndex
CREATE INDEX "claims_brokerId_idx" ON "claims"("brokerId");

-- CreateIndex
CREATE INDEX "claims_claimNumber_idx" ON "claims"("claimNumber");

-- CreateIndex
CREATE INDEX "claims_dateReceived_idx" ON "claims"("dateReceived");

-- CreateIndex
CREATE INDEX "claims_importBatchId_idx" ON "claims"("importBatchId");

-- CreateIndex
CREATE INDEX "claims_importStatusId_idx" ON "claims"("importStatusId");

-- CreateIndex
CREATE INDEX "claims_isReadOnly_idx" ON "claims"("isReadOnly");

-- CreateIndex
CREATE INDEX "claim_process_status_history_claimId_createdAt_idx" ON "claim_process_status_history"("claimId", "createdAt");

-- CreateIndex
CREATE INDEX "claim_insurers_claimId_idx" ON "claim_insurers"("claimId");

-- CreateIndex
CREATE INDEX "claim_insurers_insuranceCompanyId_idx" ON "claim_insurers"("insuranceCompanyId");

-- CreateIndex
CREATE INDEX "claim_activities_claimId_occurredAt_idx" ON "claim_activities"("claimId", "occurredAt");

-- CreateIndex
CREATE INDEX "claim_correspondence_claimId_idx" ON "claim_correspondence"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_name_key" ON "document_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_code_key" ON "document_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirements_claimTypeId_documentCategoryId_key" ON "document_requirements"("claimTypeId", "documentCategoryId");

-- CreateIndex
CREATE INDEX "documents_importBatchId_idx" ON "documents"("importBatchId");

-- CreateIndex
CREATE INDEX "reports_importBatchId_idx" ON "reports"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "claim_import_batches_status_idx" ON "claim_import_batches"("status");

-- CreateIndex
CREATE INDEX "claim_import_batches_importedById_idx" ON "claim_import_batches"("importedById");

-- CreateIndex
CREATE INDEX "claim_import_rows_importBatchId_idx" ON "claim_import_rows"("importBatchId");

-- CreateIndex
CREATE INDEX "claim_import_rows_status_idx" ON "claim_import_rows"("status");

-- CreateIndex
CREATE INDEX "claim_import_rows_duplicateOfClaimId_idx" ON "claim_import_rows"("duplicateOfClaimId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_claimTypeId_fkey" FOREIGN KEY ("claimTypeId") REFERENCES "claim_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_company_aliases" ADD CONSTRAINT "insurance_company_aliases_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_aliases" ADD CONSTRAINT "client_aliases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_aliases" ADD CONSTRAINT "broker_aliases_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuster_aliases" ADD CONSTRAINT "adjuster_aliases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_type_aliases" ADD CONSTRAINT "claim_type_aliases_claimTypeId_fkey" FOREIGN KEY ("claimTypeId") REFERENCES "claim_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimTypeId_fkey" FOREIGN KEY ("claimTypeId") REFERENCES "claim_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "claim_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_processStatusId_fkey" FOREIGN KEY ("processStatusId") REFERENCES "process_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "claim_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_importRowId_fkey" FOREIGN KEY ("importRowId") REFERENCES "claim_import_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_importStatusId_fkey" FOREIGN KEY ("importStatusId") REFERENCES "import_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_assignments" ADD CONSTRAINT "claim_assignments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_assignments" ADD CONSTRAINT "claim_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_assignments" ADD CONSTRAINT "claim_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_status_history" ADD CONSTRAINT "claim_status_history_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_status_history" ADD CONSTRAINT "claim_status_history_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "claim_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_status_history" ADD CONSTRAINT "claim_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_process_status_history" ADD CONSTRAINT "claim_process_status_history_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_process_status_history" ADD CONSTRAINT "claim_process_status_history_processStatusId_fkey" FOREIGN KEY ("processStatusId") REFERENCES "process_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_process_status_history" ADD CONSTRAINT "claim_process_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_insurers" ADD CONSTRAINT "claim_insurers_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_insurers" ADD CONSTRAINT "claim_insurers_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_activities" ADD CONSTRAINT "claim_activities_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_activities" ADD CONSTRAINT "claim_activities_importRowId_fkey" FOREIGN KEY ("importRowId") REFERENCES "claim_import_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_activities" ADD CONSTRAINT "claim_activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_correspondence" ADD CONSTRAINT "claim_correspondence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_correspondence" ADD CONSTRAINT "claim_correspondence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_correspondence" ADD CONSTRAINT "claim_correspondence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_claimTypeId_fkey" FOREIGN KEY ("claimTypeId") REFERENCES "claim_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_documentCategoryId_fkey" FOREIGN KEY ("documentCategoryId") REFERENCES "document_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentCategoryId_fkey" FOREIGN KEY ("documentCategoryId") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_assessments" ADD CONSTRAINT "loss_assessments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_assessments" ADD CONSTRAINT "loss_assessments_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_assessment_items" ADD CONSTRAINT "loss_assessment_items_lossAssessmentId_fkey" FOREIGN KEY ("lossAssessmentId") REFERENCES "loss_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_estimates" ADD CONSTRAINT "loss_estimates_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_estimates" ADD CONSTRAINT "loss_estimates_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportTemplateId_fkey" FOREIGN KEY ("reportTemplateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_responseById_fkey" FOREIGN KEY ("responseById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_import_batches" ADD CONSTRAINT "claim_import_batches_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_import_rows" ADD CONSTRAINT "claim_import_rows_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "claim_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_import_rows" ADD CONSTRAINT "claim_import_rows_duplicateOfClaimId_fkey" FOREIGN KEY ("duplicateOfClaimId") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

