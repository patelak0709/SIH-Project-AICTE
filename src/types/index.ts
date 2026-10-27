export type UserRole = 
  | 'SUPER_ADMIN'
  | 'INSTITUTION_USER'
  | 'REGIONAL_OFFICER'
  | 'BUREAU_OFFICER'
  | 'EVC_MEMBER'
  | 'COMPLIANCE_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  institutionId?: string;
  avatar?: string;
}

export type Region = 
  | 'Northern Region (NRO)'
  | 'Western Region (WRO)'
  | 'Southern Region (SRO)'
  | 'Eastern Region (ERO)'
  | 'Central Region (CRO)'
  | 'South-Western Region (SWRO)';

export type ApplicationType =
  | 'Extension of Approval (EoA)'
  | 'New Technical Institution'
  | 'Course Addition / Intake Increase'
  | 'Closure / Conversion of Institution';

export type ApplicationStage =
  | 'Submitted'
  | 'Under Scrutiny'
  | 'Returned for Deficiency'
  | 'EVC Pending'
  | 'EVC Scheduled'
  | 'Awaiting SAC/SHC'
  | 'Compliance Pending'
  | 'Completed'
  | 'Rejected';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StageHistoryEntry {
  id: string;
  stage: ApplicationStage;
  enteredAt: string;
  exitedAt?: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  comments?: string;
  deficiencyReason?: string;
}

export interface Application {
  id: string;
  appNumber: string; // e.g. APP-2026-NRO-1001
  institutionId: string;
  institutionName: string;
  region: Region;
  applicationType: ApplicationType;
  submissionDate: string;
  targetSlaDays: number;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  currentStage: ApplicationStage;
  workflowType: 'SCRUTINY_ONLY' | 'EVC_ONLY' | 'SCRUTINY_EVC' | 'EVC_SAC_SHC' | 'FULL_PROCESS';
  prerequisitesMet: {
    documentsVerified: boolean;
    feePaid: boolean;
    evcReportSubmitted: boolean;
    sacApproved: boolean;
    undertakingsCleared: boolean;
  };
  deficiencyNotes?: string;
  riskLevel: RiskLevel;
  daysPendingInCurrentStage: number;
  stageHistory: StageHistoryEntry[];
  updatedAt: string;
}

export interface WorkflowStageDefinition {
  stage: ApplicationStage;
  sequenceOrder: number;
  responsibleRole: UserRole;
  slaDays: number;
  requiredPrerequisites: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  code: string; // e.g. SCRUTINY_EVC
  description: string;
  stages: WorkflowStageDefinition[];
}

export interface EVCCommitteeMember {
  id: string;
  name: string;
  designation: string;
  institution: string;
  expertise: string;
}

export interface EVCSchedule {
  id: string;
  appId: string;
  appNumber: string;
  institutionName: string;
  region: Region;
  scheduledDate: string;
  visitDate: string;
  committeeMembers: EVCCommitteeMember[];
  status: 'QUEUED' | 'SCHEDULED' | 'VISIT_CONDUCTED' | 'REPORT_SUBMITTED' | 'RE_EVC_RECOMMENDED';
  reportNotes?: string;
  deficiencyChecklist: {
    buildingSafety: boolean;
    labEquipment: boolean;
    facultyCadreRatio: boolean;
    libraryBooks: boolean;
  };
  createdAt: string;
}

export interface UndertakingObligation {
  id: string;
  appId?: string;
  institutionId: string;
  institutionName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING_SUBMISSION' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'VERIFIED' | 'DEFICIENT' | 'OVERDUE';
  submittedDocumentName?: string;
  submittedDocumentUrl?: string;
  submittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  officerRemarks?: string;
}

export interface LeaseDocument {
  id: string;
  institutionId: string;
  institutionName: string;
  region: Region;
  documentType: 'Land Lease Deed' | 'Building Safety Certificate' | 'Fire Safety NOC' | 'University Affiliation Letter' | 'AICTE Security Deposit';
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  daysRemaining: number;
  renewalStatus: 'ACTIVE' | 'WARNING_30_DAYS' | 'WARNING_15_DAYS' | 'WARNING_7_DAYS' | 'EXPIRED' | 'RENEWAL_SUBMITTED' | 'VERIFIED';
  fileUrl?: string;
  extractedAiFields?: {
    extractedName?: string;
    extractedDocNo?: string;
    extractedExpiry?: string;
    discrepancyFound?: boolean;
    confidenceScore?: number;
    discrepancyNotes?: string;
  };
}

export interface SystemNotification {
  id: string;
  recipientRole?: UserRole;
  recipientId?: string;
  title: string;
  message: string;
  type: 'DEADLINE_ALERT' | 'STAGE_CHANGE' | 'EVC_REMINDER' | 'LEASE_EXPIRY' | 'ESCALATION';
  escalationLevel?: 1 | 2 | 3;
  targetEntityId: string;
  targetEntityType: 'APPLICATION' | 'EVC' | 'DOCUMENT' | 'UNDERTAKING';
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  entityType: string;
  entityId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  ipAddress: string;
}

export interface AiExtractionResult {
  documentType: string;
  institutionName: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  keyTermsExtracted: string[];
  discrepancies: {
    field: string;
    expected: string;
    extracted: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  confidenceScore: number;
  summary: string;
}

export interface NaturalLanguageQueryResult {
  query: string;
  interpretedIntent: string;
  summaryText: string;
  metrics: { label: string; value: string | number; change?: string }[];
  dataRows: Record<string, any>[];
  suggestedFollowups: string[];
}
