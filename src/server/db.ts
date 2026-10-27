import { 
  User, Application, WorkflowDefinition, EVCSchedule, 
  UndertakingObligation, LeaseDocument, SystemNotification, 
  AuditLog, ApplicationStage, Region, UserRole 
} from '../types';
import { calculateApplicationRisk, calculateExpiryWarningStatus, calculateEscalationLevel } from '../utils/rules';

// Initial Seed Users
export const SEED_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Dr. Ramesh Kumar (Super Admin)',
    email: 'admin@aicte.gov.in',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-ro-north',
    name: 'Shri A. K. Verma (Regional Officer - North)',
    email: 'ro.north@aicte.gov.in',
    role: 'REGIONAL_OFFICER',
    region: 'Northern Region (NRO)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-ro-west',
    name: 'Smt. Priya Sharma (Regional Officer - West)',
    email: 'ro.west@aicte.gov.in',
    role: 'REGIONAL_OFFICER',
    region: 'Western Region (WRO)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-bureau',
    name: 'Prof. S. N. Roy (Bureau Officer)',
    email: 'bureau.head@aicte.gov.in',
    role: 'BUREAU_OFFICER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-evc',
    name: 'Dr. Meenakshi Sundaram (EVC Expert Member)',
    email: 'evc.expert@aicte.gov.in',
    role: 'EVC_MEMBER',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-compliance',
    name: 'Shri Rajiv Nair (Compliance Verification Officer)',
    email: 'compliance@aicte.gov.in',
    role: 'COMPLIANCE_OFFICER',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-inst-1',
    name: 'Dr. Rajesh Gupta (Registrar - Delhi Tech Univ)',
    email: 'registrar@dtu.ac.in',
    role: 'INSTITUTION_USER',
    institutionId: 'inst-101',
    region: 'Northern Region (NRO)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-inst-2',
    name: 'Prof. Anil Deshmukh (Director - VJTI Mumbai)',
    email: 'director@vjti.ac.in',
    role: 'INSTITUTION_USER',
    institutionId: 'inst-102',
    region: 'Western Region (WRO)',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
  },
];

// Initial Seed Workflows
export const SEED_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-full',
    name: 'Full Statutory Approval Process',
    code: 'FULL_PROCESS',
    description: 'Standard multi-tier workflow for new technical institutions and major expansion programs.',
    stages: [
      { stage: 'Submitted', sequenceOrder: 1, responsibleRole: 'INSTITUTION_USER', slaDays: 2, requiredPrerequisites: ['FEE_PAID'] },
      { stage: 'Under Scrutiny', sequenceOrder: 2, responsibleRole: 'REGIONAL_OFFICER', slaDays: 7, requiredPrerequisites: ['DOCS_VERIFIED'] },
      { stage: 'EVC Pending', sequenceOrder: 3, responsibleRole: 'REGIONAL_OFFICER', slaDays: 3, requiredPrerequisites: ['EVC_COMMITTEE_ASSIGNED'] },
      { stage: 'EVC Scheduled', sequenceOrder: 4, responsibleRole: 'EVC_MEMBER', slaDays: 10, requiredPrerequisites: ['EVC_REPORT_SUBMITTED'] },
      { stage: 'Awaiting SAC/SHC', sequenceOrder: 5, responsibleRole: 'BUREAU_OFFICER', slaDays: 7, requiredPrerequisites: ['SAC_APPROVED'] },
      { stage: 'Compliance Pending', sequenceOrder: 6, responsibleRole: 'COMPLIANCE_OFFICER', slaDays: 5, requiredPrerequisites: ['UNDERTAKINGS_CLEARED'] },
      { stage: 'Completed', sequenceOrder: 7, responsibleRole: 'SUPER_ADMIN', slaDays: 1, requiredPrerequisites: [] },
    ],
  },
  {
    id: 'wf-scrutiny-evc',
    name: 'Scrutiny + EVC Combined Workflow',
    code: 'SCRUTINY_EVC',
    description: 'Fast-track workflow for course addition and intake expansion in accredited institutions.',
    stages: [
      { stage: 'Submitted', sequenceOrder: 1, responsibleRole: 'INSTITUTION_USER', slaDays: 2, requiredPrerequisites: ['FEE_PAID'] },
      { stage: 'Under Scrutiny', sequenceOrder: 2, responsibleRole: 'REGIONAL_OFFICER', slaDays: 5, requiredPrerequisites: ['DOCS_VERIFIED'] },
      { stage: 'EVC Scheduled', sequenceOrder: 3, responsibleRole: 'EVC_MEMBER', slaDays: 7, requiredPrerequisites: ['EVC_REPORT_SUBMITTED'] },
      { stage: 'Compliance Pending', sequenceOrder: 4, responsibleRole: 'COMPLIANCE_OFFICER', slaDays: 3, requiredPrerequisites: ['UNDERTAKINGS_CLEARED'] },
      { stage: 'Completed', sequenceOrder: 5, responsibleRole: 'REGIONAL_OFFICER', slaDays: 1, requiredPrerequisites: [] },
    ],
  },
  {
    id: 'wf-scrutiny-only',
    name: 'Only Scrutiny Workflow (Extension of Approval)',
    code: 'SCRUTINY_ONLY',
    description: 'Annual routine extension of approval for existing compliant institutions.',
    stages: [
      { stage: 'Submitted', sequenceOrder: 1, responsibleRole: 'INSTITUTION_USER', slaDays: 2, requiredPrerequisites: ['FEE_PAID'] },
      { stage: 'Under Scrutiny', sequenceOrder: 2, responsibleRole: 'REGIONAL_OFFICER', slaDays: 5, requiredPrerequisites: ['DOCS_VERIFIED'] },
      { stage: 'Compliance Pending', sequenceOrder: 3, responsibleRole: 'COMPLIANCE_OFFICER', slaDays: 3, requiredPrerequisites: ['UNDERTAKINGS_CLEARED'] },
      { stage: 'Completed', sequenceOrder: 4, responsibleRole: 'REGIONAL_OFFICER', slaDays: 1, requiredPrerequisites: [] },
    ],
  },
];

// Initial Seed Applications
export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-1001',
    appNumber: 'APP-2026-NRO-1001',
    institutionId: 'inst-101',
    institutionName: 'Delhi Technological University (DTU)',
    region: 'Northern Region (NRO)',
    applicationType: 'Extension of Approval (EoA)',
    submissionDate: '2026-10-01',
    targetSlaDays: 7,
    assignedOfficerId: 'user-ro-north',
    assignedOfficerName: 'Shri A. K. Verma',
    currentStage: 'Under Scrutiny',
    workflowType: 'SCRUTINY_ONLY',
    prerequisitesMet: {
      documentsVerified: false,
      feePaid: true,
      evcReportSubmitted: true,
      sacApproved: true,
      undertakingsCleared: true,
    },
    riskLevel: 'MEDIUM',
    daysPendingInCurrentStage: 12,
    stageHistory: [
      {
        id: 'sh-1',
        stage: 'Submitted',
        enteredAt: '2026-10-01T10:00:00Z',
        exitedAt: '2026-10-02T14:20:00Z',
        actorName: 'Dr. Rajesh Gupta',
        actorRole: 'INSTITUTION_USER',
        action: 'Application Submitted with Fee Payment receipt #TXN88921',
      },
      {
        id: 'sh-2',
        stage: 'Under Scrutiny',
        enteredAt: '2026-10-02T14:20:00Z',
        actorName: 'Shri A. K. Verma',
        actorRole: 'REGIONAL_OFFICER',
        action: 'Assigned to Regional Scrutiny Desk',
      },
    ],
    updatedAt: '2026-10-14T11:00:00Z',
  },
  {
    id: 'app-1002',
    appNumber: 'APP-2026-WRO-2004',
    institutionId: 'inst-102',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    region: 'Western Region (WRO)',
    applicationType: 'Course Addition / Intake Increase',
    submissionDate: '2026-09-15',
    targetSlaDays: 10,
    assignedOfficerId: 'user-ro-west',
    assignedOfficerName: 'Smt. Priya Sharma',
    currentStage: 'EVC Scheduled',
    workflowType: 'SCRUTINY_EVC',
    prerequisitesMet: {
      documentsVerified: true,
      feePaid: true,
      evcReportSubmitted: false,
      sacApproved: false,
      undertakingsCleared: true,
    },
    riskLevel: 'HIGH',
    daysPendingInCurrentStage: 18,
    stageHistory: [
      {
        id: 'sh-3',
        stage: 'Submitted',
        enteredAt: '2026-09-15T09:00:00Z',
        exitedAt: '2026-09-16T11:00:00Z',
        actorName: 'Prof. Anil Deshmukh',
        actorRole: 'INSTITUTION_USER',
        action: 'Application for Artificial Intelligence & Data Science 60 seat intake expansion submitted',
      },
      {
        id: 'sh-4',
        stage: 'Under Scrutiny',
        enteredAt: '2026-09-16T11:00:00Z',
        exitedAt: '2026-09-22T16:00:00Z',
        actorName: 'Smt. Priya Sharma',
        actorRole: 'REGIONAL_OFFICER',
        action: 'Scrutiny verified. Recommended Expert Visit Committee inspection for lab facilities.',
      },
      {
        id: 'sh-5',
        stage: 'EVC Scheduled',
        enteredAt: '2026-09-22T16:00:00Z',
        actorName: 'Smt. Priya Sharma',
        actorRole: 'REGIONAL_OFFICER',
        action: 'EVC Panel constituted with 3 experts',
      },
    ],
    updatedAt: '2026-10-10T14:30:00Z',
  },
  {
    id: 'app-1003',
    appNumber: 'APP-2026-SRO-3012',
    institutionId: 'inst-103',
    institutionName: 'Bangalore Institute of Technology & Research',
    region: 'Southern Region (SRO)',
    applicationType: 'New Technical Institution',
    submissionDate: '2026-08-20',
    targetSlaDays: 15,
    assignedOfficerId: 'user-bureau',
    assignedOfficerName: 'Prof. S. N. Roy',
    currentStage: 'Awaiting SAC/SHC',
    workflowType: 'FULL_PROCESS',
    prerequisitesMet: {
      documentsVerified: true,
      feePaid: true,
      evcReportSubmitted: true,
      sacApproved: false,
      undertakingsCleared: true,
    },
    riskLevel: 'CRITICAL',
    daysPendingInCurrentStage: 28,
    stageHistory: [
      {
        id: 'sh-6',
        stage: 'Submitted',
        enteredAt: '2026-08-20T10:00:00Z',
        exitedAt: '2026-08-22T12:00:00Z',
        actorName: 'Dr. C. Ramanujam',
        actorRole: 'INSTITUTION_USER',
        action: 'New Institution proposal submitted',
      },
      {
        id: 'sh-7',
        stage: 'Under Scrutiny',
        enteredAt: '2026-08-22T12:00:00Z',
        exitedAt: '2026-09-01T10:00:00Z',
        actorName: 'Regional Officer SRO',
        actorRole: 'REGIONAL_OFFICER',
        action: 'Scrutiny completed successfully',
      },
      {
        id: 'sh-8',
        stage: 'EVC Scheduled',
        enteredAt: '2026-09-01T10:00:00Z',
        exitedAt: '2026-09-18T15:00:00Z',
        actorName: 'Dr. Meenakshi Sundaram',
        actorRole: 'EVC_MEMBER',
        action: 'Physical EVC inspection conducted. Report uploaded with conditional recommendations.',
      },
      {
        id: 'sh-9',
        stage: 'Awaiting SAC/SHC',
        enteredAt: '2026-09-18T15:00:00Z',
        actorName: 'Prof. S. N. Roy',
        actorRole: 'BUREAU_OFFICER',
        action: 'Case referred to Standing Appellate Committee (SAC)',
      },
    ],
    updatedAt: '2026-10-16T17:00:00Z',
  },
  {
    id: 'app-1004',
    appNumber: 'APP-2026-ERO-4008',
    institutionId: 'inst-104',
    institutionName: 'Kolkata Academy of Science & Engineering',
    region: 'Eastern Region (ERO)',
    applicationType: 'Extension of Approval (EoA)',
    submissionDate: '2026-10-18',
    targetSlaDays: 7,
    assignedOfficerId: 'user-compliance',
    assignedOfficerName: 'Shri Rajiv Nair',
    currentStage: 'Compliance Pending',
    workflowType: 'SCRUTINY_ONLY',
    prerequisitesMet: {
      documentsVerified: true,
      feePaid: true,
      evcReportSubmitted: true,
      sacApproved: true,
      undertakingsCleared: false,
    },
    riskLevel: 'LOW',
    daysPendingInCurrentStage: 3,
    stageHistory: [
      {
        id: 'sh-10',
        stage: 'Submitted',
        enteredAt: '2026-10-18T08:30:00Z',
        exitedAt: '2026-10-19T10:00:00Z',
        actorName: 'Principal ERO',
        actorRole: 'INSTITUTION_USER',
        action: 'Application submitted',
      },
      {
        id: 'sh-11',
        stage: 'Under Scrutiny',
        enteredAt: '2026-10-19T10:00:00Z',
        exitedAt: '2026-10-23T11:00:00Z',
        actorName: 'Regional Officer ERO',
        actorRole: 'REGIONAL_OFFICER',
        action: 'Scrutiny cleared. Awaiting barrier-free PwD certificate compliance.',
      },
      {
        id: 'sh-12',
        stage: 'Compliance Pending',
        enteredAt: '2026-10-23T11:00:00Z',
        actorName: 'Shri Rajiv Nair',
        actorRole: 'COMPLIANCE_OFFICER',
        action: 'Pending compliance document upload from institution',
      },
    ],
    updatedAt: '2026-10-23T11:00:00Z',
  },
  {
    id: 'app-1005',
    appNumber: 'APP-2026-CRO-5002',
    institutionId: 'inst-105',
    institutionName: 'Bhopal Institute of Technology',
    region: 'Central Region (CRO)',
    applicationType: 'Extension of Approval (EoA)',
    submissionDate: '2026-10-10',
    targetSlaDays: 7,
    assignedOfficerId: 'user-ro-north',
    assignedOfficerName: 'Shri A. K. Verma',
    currentStage: 'Completed',
    workflowType: 'SCRUTINY_ONLY',
    prerequisitesMet: {
      documentsVerified: true,
      feePaid: true,
      evcReportSubmitted: true,
      sacApproved: true,
      undertakingsCleared: true,
    },
    riskLevel: 'LOW',
    daysPendingInCurrentStage: 0,
    stageHistory: [
      {
        id: 'sh-13',
        stage: 'Submitted',
        enteredAt: '2026-10-10T10:00:00Z',
        exitedAt: '2026-10-11T12:00:00Z',
        actorName: 'Director CRO',
        actorRole: 'INSTITUTION_USER',
        action: 'EoA application submitted with all enclosures',
      },
      {
        id: 'sh-14',
        stage: 'Under Scrutiny',
        enteredAt: '2026-10-11T12:00:00Z',
        exitedAt: '2026-10-14T15:00:00Z',
        actorName: 'Regional Officer CRO',
        actorRole: 'REGIONAL_OFFICER',
        action: 'Scrutiny passed',
      },
      {
        id: 'sh-15',
        stage: 'Compliance Pending',
        enteredAt: '2026-10-14T15:00:00Z',
        exitedAt: '2026-10-16T11:00:00Z',
        actorName: 'Shri Rajiv Nair',
        actorRole: 'COMPLIANCE_OFFICER',
        action: 'All undertakings verified',
      },
      {
        id: 'sh-16',
        stage: 'Completed',
        enteredAt: '2026-10-16T11:00:00Z',
        actorName: 'Dr. Ramesh Kumar',
        actorRole: 'SUPER_ADMIN',
        action: 'Statutory Approval Letter Generated & Signed',
      },
    ],
    updatedAt: '2026-10-16T11:00:00Z',
  },
];

// Initial Seed EVC Schedules
export const SEED_EVC_SCHEDULES: EVCSchedule[] = [
  {
    id: 'evc-201',
    appId: 'app-1002',
    appNumber: 'APP-2026-WRO-2004',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    region: 'Western Region (WRO)',
    scheduledDate: '2026-10-12',
    visitDate: '2026-10-28',
    committeeMembers: [
      { id: 'm-1', name: 'Dr. Meenakshi Sundaram', designation: 'Professor & Dean', institution: 'IIT Bombay', expertise: 'Artificial Intelligence & Robotics' },
      { id: 'm-2', name: 'Dr. Suresh R. Patil', designation: 'Professor', institution: 'COEP Technological Univ', expertise: 'Computer Networks' },
      { id: 'm-3', name: 'Architect K. Mehta', designation: 'Council Member', institution: 'COA India', expertise: 'Infrastructure & Safety' },
    ],
    status: 'SCHEDULED',
    reportNotes: 'Inspection scheduled for new AI lab facility, server room, and high-performance GPU workstations.',
    deficiencyChecklist: {
      buildingSafety: true,
      labEquipment: false,
      facultyCadreRatio: true,
      libraryBooks: true,
    },
    createdAt: '2026-09-22T16:00:00Z',
  },
  {
    id: 'evc-202',
    appId: 'app-1003',
    appNumber: 'APP-2026-SRO-3012',
    institutionName: 'Bangalore Institute of Technology & Research',
    region: 'Southern Region (SRO)',
    scheduledDate: '2026-09-10',
    visitDate: '2026-09-15',
    committeeMembers: [
      { id: 'm-4', name: 'Prof. K. Swaminathan', designation: 'Director', institution: 'NIT Trichy', expertise: 'Civil & Structural Engineering' },
      { id: 'm-5', name: 'Dr. Nalini Sharma', designation: 'Professor', institution: 'IISc Bangalore', expertise: 'Electrical Engineering' },
    ],
    status: 'REPORT_SUBMITTED',
    reportNotes: 'Physical inspection completed. Campus building structure verified. Fire NOC copy required re-validation.',
    deficiencyChecklist: {
      buildingSafety: true,
      labEquipment: true,
      facultyCadreRatio: true,
      libraryBooks: true,
    },
    createdAt: '2026-09-01T10:00:00Z',
  },
];

// Initial Seed Undertakings & Compliance
export const SEED_UNDERTAKINGS: UndertakingObligation[] = [
  {
    id: 'und-301',
    appId: 'app-1001',
    institutionId: 'inst-101',
    institutionName: 'Delhi Technological University (DTU)',
    title: 'NBA Accreditation Status Affidavit for PG Programs',
    description: 'Mandatory sworn undertaking regarding 50% NBA accredited programs for ongoing approval.',
    dueDate: '2026-11-05',
    status: 'VERIFIED',
    submittedDocumentName: 'DTU_NBA_Affidavit_2026.pdf',
    submittedAt: '2026-10-05T14:00:00Z',
    verifiedBy: 'Shri Rajiv Nair',
    verifiedAt: '2026-10-08T11:30:00Z',
    officerRemarks: 'Affidavit verified against NBA official portal records.',
  },
  {
    id: 'und-302',
    appId: 'app-1004',
    institutionId: 'inst-104',
    institutionName: 'Kolkata Academy of Science & Engineering',
    title: 'Barrier-Free Accessibility Certificate for PwD Students',
    description: 'Structural certificate proving lifts, ramps, braille signage, and accessible toilets across all blocks.',
    dueDate: '2026-10-30',
    status: 'SUBMITTED',
    submittedDocumentName: 'KASE_Accessibility_Audit_2026.pdf',
    submittedAt: '2026-10-24T09:15:00Z',
    officerRemarks: 'Under review by Compliance Officer.',
  },
  {
    id: 'und-303',
    appId: 'app-1002',
    institutionId: 'inst-102',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    title: 'Faculty Cadre Ratio Compliance Undertaking (1:15)',
    description: 'Formal undertaking detailing Assistant Professor, Associate Professor, and Professor cadre ratio.',
    dueDate: '2026-10-15',
    status: 'OVERDUE',
    officerRemarks: 'Overdue by 11 days. Escalation Level 2 alert triggered.',
  },
];

// Initial Seed Lease & Expiry Documents
export const SEED_LEASE_DOCUMENTS: LeaseDocument[] = [
  {
    id: 'doc-401',
    institutionId: 'inst-101',
    institutionName: 'Delhi Technological University (DTU)',
    region: 'Northern Region (NRO)',
    documentType: 'Land Lease Deed',
    documentNumber: 'REG-DEL-2008-9941',
    issuingAuthority: 'Sub-Registrar Delhi North',
    issueDate: '2008-11-01',
    expiryDate: '2026-11-01',
    daysRemaining: 6,
    renewalStatus: 'WARNING_7_DAYS',
    fileUrl: '/sample-documents/dtu-land-lease.pdf',
    extractedAiFields: {
      extractedName: 'Delhi Technological University',
      extractedDocNo: 'REG-DEL-2008-9941',
      extractedExpiry: '2026-11-01',
      discrepancyFound: false,
      confidenceScore: 0.98,
      discrepancyNotes: 'AI extracted fields match institutional master records 100%.',
    },
  },
  {
    id: 'doc-402',
    institutionId: 'inst-102',
    institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
    region: 'Western Region (WRO)',
    documentType: 'Fire Safety NOC',
    documentNumber: 'NOC-FS-MUM-2023-412',
    issuingAuthority: 'Mumbai Fire Brigade Headquarters',
    issueDate: '2023-11-10',
    expiryDate: '2026-11-10',
    daysRemaining: 15,
    renewalStatus: 'WARNING_15_DAYS',
    fileUrl: '/sample-documents/vjti-fire-noc.pdf',
    extractedAiFields: {
      extractedName: 'VJTI Matunga Campus',
      extractedDocNo: 'NOC-FS-MUM-2023-412',
      extractedExpiry: '2026-11-10',
      discrepancyFound: false,
      confidenceScore: 0.95,
    },
  },
  {
    id: 'doc-403',
    institutionId: 'inst-103',
    institutionName: 'Bangalore Institute of Technology & Research',
    region: 'Southern Region (SRO)',
    documentType: 'Building Safety Certificate',
    documentNumber: 'PWD-KAR-2021-8810',
    issuingAuthority: 'PWD Chief Engineer Karnataka',
    issueDate: '2021-10-10',
    expiryDate: '2026-10-10',
    daysRemaining: -16,
    renewalStatus: 'EXPIRED',
    fileUrl: '/sample-documents/bitr-building-safety.pdf',
    extractedAiFields: {
      extractedName: 'Bangalore Inst of Tech & Research',
      extractedDocNo: 'PWD-KAR-2021-8810',
      extractedExpiry: '2026-10-10',
      discrepancyFound: true,
      confidenceScore: 0.91,
      discrepancyNotes: 'DISCREPANCY DETECTED: Document expired on 10th October 2026. Renewal certificate submission mandatory.',
    },
  },
  {
    id: 'doc-404',
    institutionId: 'inst-104',
    institutionName: 'Kolkata Academy of Science & Engineering',
    region: 'Eastern Region (ERO)',
    documentType: 'University Affiliation Letter',
    documentNumber: 'MAKAUT/AFF/2025/1102',
    issuingAuthority: 'MAKAUT University Registrar',
    issueDate: '2025-06-01',
    expiryDate: '2026-11-25',
    daysRemaining: 30,
    renewalStatus: 'WARNING_30_DAYS',
    fileUrl: '/sample-documents/kase-affiliation.pdf',
  },
];

// Initial Seed System Notifications
export const SEED_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-501',
    recipientRole: 'REGIONAL_OFFICER',
    title: 'SLA Pendency Warning: APP-2026-NRO-1001',
    message: 'Application has been under scrutiny for 12 days (SLA Target: 7 days). Immediate officer action required.',
    type: 'DEADLINE_ALERT',
    escalationLevel: 1,
    targetEntityId: 'app-1001',
    targetEntityType: 'APPLICATION',
    status: 'UNREAD',
    createdAt: '2026-10-24T08:00:00Z',
  },
  {
    id: 'notif-502',
    recipientRole: 'BUREAU_OFFICER',
    title: 'Level 2 Escalation: APP-2026-SRO-3012',
    message: 'Awaiting SAC/SHC stage pending for 28 days. Bureau Officer intervention recommended.',
    type: 'ESCALATION',
    escalationLevel: 2,
    targetEntityId: 'app-1003',
    targetEntityType: 'APPLICATION',
    status: 'UNREAD',
    createdAt: '2026-10-25T10:30:00Z',
  },
  {
    id: 'notif-503',
    recipientRole: 'INSTITUTION_USER',
    recipientId: 'user-inst-1',
    title: 'Urgent Document Expiry: Land Lease Deed Expiry in 6 Days',
    message: 'Your Land Lease Deed REG-DEL-2008-9941 expires on 01-Nov-2026. Submit renewal copy immediately to prevent approval hold.',
    type: 'LEASE_EXPIRY',
    targetEntityId: 'doc-401',
    targetEntityType: 'DOCUMENT',
    status: 'UNREAD',
    createdAt: '2026-10-26T06:00:00Z',
  },
];

// Initial Seed Audit Log
export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-601',
    timestamp: '2026-10-01T10:00:00Z',
    actorId: 'user-inst-1',
    actorName: 'Dr. Rajesh Gupta',
    actorRole: 'INSTITUTION_USER',
    entityType: 'APPLICATION',
    entityId: 'app-1001',
    action: 'APPLICATION_SUBMITTED',
    previousStatus: 'Draft',
    newStatus: 'Submitted',
    reason: 'Application submitted along with institutional fee payment token #TXN88921',
    ipAddress: '14.139.224.12',
  },
  {
    id: 'aud-602',
    timestamp: '2026-10-02T14:20:00Z',
    actorId: 'user-ro-north',
    actorName: 'Shri A. K. Verma',
    actorRole: 'REGIONAL_OFFICER',
    entityType: 'APPLICATION',
    entityId: 'app-1001',
    action: 'STAGE_ADVANCED',
    previousStatus: 'Submitted',
    newStatus: 'Under Scrutiny',
    reason: 'Scrutiny desk review initiated.',
    ipAddress: '164.100.24.81',
  },
  {
    id: 'aud-603',
    timestamp: '2026-09-22T16:00:00Z',
    actorId: 'user-ro-west',
    actorName: 'Smt. Priya Sharma',
    actorRole: 'REGIONAL_OFFICER',
    entityType: 'APPLICATION',
    entityId: 'app-1002',
    action: 'EVC_SCHEDULED',
    previousStatus: 'Under Scrutiny',
    newStatus: 'EVC Scheduled',
    reason: 'EVC Panel constituted for lab & faculty verification.',
    ipAddress: '164.100.28.14',
  },
];

// In-Memory Database Class
class Database {
  private users: User[] = [...SEED_USERS];
  private workflows: WorkflowDefinition[] = [...SEED_WORKFLOWS];
  private applications: Application[] = [...SEED_APPLICATIONS];
  private evcSchedules: EVCSchedule[] = [...SEED_EVC_SCHEDULES];
  private undertakings: UndertakingObligation[] = [...SEED_UNDERTAKINGS];
  private leaseDocuments: LeaseDocument[] = [...SEED_LEASE_DOCUMENTS];
  private notifications: SystemNotification[] = [...SEED_NOTIFICATIONS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];

  // Users
  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  // Workflows
  getWorkflows(): WorkflowDefinition[] {
    return this.workflows;
  }

  updateWorkflow(wf: WorkflowDefinition, actor: { name: string; role: UserRole; id: string }): WorkflowDefinition {
    const idx = this.workflows.findIndex(w => w.id === wf.id);
    if (idx >= 0) {
      this.workflows[idx] = wf;
    } else {
      this.workflows.push(wf);
    }
    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'WORKFLOW',
      entityId: wf.id,
      action: 'WORKFLOW_CONFIGURED',
      reason: `Updated workflow stages configuration for ${wf.name}`,
      ipAddress: '127.0.0.1',
    });
    return wf;
  }

  // Applications
  getApplications(filter?: { region?: string; stage?: string; risk?: string; search?: string }): Application[] {
    let result = [...this.applications];
    if (filter) {
      if (filter.region && filter.region !== 'ALL') {
        result = result.filter(a => a.region === filter.region);
      }
      if (filter.stage && filter.stage !== 'ALL') {
        result = result.filter(a => a.currentStage === filter.stage);
      }
      if (filter.risk && filter.risk !== 'ALL') {
        result = result.filter(a => a.riskLevel === filter.risk);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(a => 
          a.appNumber.toLowerCase().includes(q) || 
          a.institutionName.toLowerCase().includes(q) ||
          a.applicationType.toLowerCase().includes(q)
        );
      }
    }
    return result;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find(a => a.id === id || a.appNumber === id);
  }

  createApplication(appData: Partial<Application>, actor: User): Application {
    const id = `app-${Date.now()}`;
    const seq = Math.floor(1000 + Math.random() * 9000);
    const appNumber = `APP-2026-${appData.region ? appData.region.substring(0, 3).toUpperCase() : 'NRO'}-${seq}`;

    const newApp: Application = {
      id,
      appNumber,
      institutionId: appData.institutionId || actor.institutionId || 'inst-gen',
      institutionName: appData.institutionName || 'Submitted Institute',
      region: appData.region || 'Northern Region (NRO)',
      applicationType: appData.applicationType || 'Extension of Approval (EoA)',
      submissionDate: new Date().toISOString().split('T')[0],
      targetSlaDays: appData.targetSlaDays || 7,
      assignedOfficerId: 'user-ro-north',
      assignedOfficerName: 'Shri A. K. Verma',
      currentStage: 'Submitted',
      workflowType: appData.workflowType || 'SCRUTINY_ONLY',
      prerequisitesMet: {
        documentsVerified: false,
        feePaid: true,
        evcReportSubmitted: false,
        sacApproved: false,
        undertakingsCleared: false,
      },
      riskLevel: 'LOW',
      daysPendingInCurrentStage: 0,
      stageHistory: [
        {
          id: `sh-${Date.now()}`,
          stage: 'Submitted',
          enteredAt: new Date().toISOString(),
          actorName: actor.name,
          actorRole: actor.role,
          action: 'New Application Created & Submitted',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    this.applications.unshift(newApp);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'APPLICATION',
      entityId: newApp.id,
      action: 'APPLICATION_CREATED',
      newStatus: 'Submitted',
      reason: `Application ${appNumber} created for ${newApp.institutionName}`,
      ipAddress: '127.0.0.1',
    });

    return newApp;
  }

  updateApplicationStage(
    appId: string, 
    nextStage: ApplicationStage, 
    actionType: 'ADVANCE' | 'REVERT_DEFICIENCY', 
    reason: string, 
    actor: User
  ): Application {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const prevStage = app.currentStage;
    app.currentStage = nextStage;
    app.daysPendingInCurrentStage = 0;
    app.updatedAt = new Date().toISOString();

    if (actionType === 'REVERT_DEFICIENCY') {
      app.deficiencyNotes = reason;
      app.riskLevel = 'HIGH';
    } else {
      app.deficiencyNotes = undefined;
      app.riskLevel = calculateApplicationRisk(0, app.targetSlaDays, 0, nextStage);
    }

    // Record stage history
    const historyEntry = {
      id: `sh-${Date.now()}`,
      stage: nextStage,
      enteredAt: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      action: actionType === 'REVERT_DEFICIENCY' ? `Returned for Deficiency: ${reason}` : `Advanced stage to ${nextStage}`,
      comments: reason,
      deficiencyReason: actionType === 'REVERT_DEFICIENCY' ? reason : undefined,
    };

    if (app.stageHistory.length > 0) {
      app.stageHistory[app.stageHistory.length - 1].exitedAt = new Date().toISOString();
    }
    app.stageHistory.push(historyEntry);

    // Add Audit log
    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'APPLICATION',
      entityId: app.id,
      action: actionType === 'REVERT_DEFICIENCY' ? 'DEFICIENCY_RAISED' : 'STAGE_ADVANCED',
      previousStatus: prevStage,
      newStatus: nextStage,
      reason: reason,
      ipAddress: '127.0.0.1',
    });

    // Notify applicant institution
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'INSTITUTION_USER',
      title: `Status Update: ${app.appNumber}`,
      message: `Your application status has been changed from ${prevStage} to ${nextStage}. ${reason ? `Notes: ${reason}` : ''}`,
      type: 'STAGE_CHANGE',
      targetEntityId: app.id,
      targetEntityType: 'APPLICATION',
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
    });

    return app;
  }

  updatePrerequisite(appId: string, prerequisiteKey: keyof Application['prerequisitesMet'], value: boolean, actor: User): Application {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    app.prerequisitesMet[prerequisiteKey] = value;
    app.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'APPLICATION',
      entityId: app.id,
      action: 'PREREQUISITE_UPDATED',
      reason: `Prerequisite ${prerequisiteKey} set to ${value}`,
      ipAddress: '127.0.0.1',
    });

    return app;
  }

  // EVC
  getEvcSchedules(): EVCSchedule[] {
    return this.evcSchedules;
  }

  createEvcSchedule(data: Partial<EVCSchedule>, actor: User): EVCSchedule {
    const newEvc: EVCSchedule = {
      id: `evc-${Date.now()}`,
      appId: data.appId || 'app-1001',
      appNumber: data.appNumber || 'APP-2026-NRO-1001',
      institutionName: data.institutionName || 'Unknown Inst',
      region: data.region || 'Northern Region (NRO)',
      scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
      visitDate: data.visitDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      committeeMembers: data.committeeMembers || [
        { id: 'm-x', name: 'Dr. Meenakshi Sundaram', designation: 'Professor', institution: 'IIT Bombay', expertise: 'Computer Science' },
      ],
      status: 'SCHEDULED',
      reportNotes: data.reportNotes,
      deficiencyChecklist: data.deficiencyChecklist || {
        buildingSafety: true,
        labEquipment: true,
        facultyCadreRatio: true,
        libraryBooks: true,
      },
      createdAt: new Date().toISOString(),
    };

    this.evcSchedules.unshift(newEvc);

    // Update application stage if needed
    const app = this.getApplicationById(newEvc.appId);
    if (app && app.currentStage === 'EVC Pending') {
      this.updateApplicationStage(app.id, 'EVC Scheduled', 'ADVANCE', 'EVC Inspection Panel scheduled', actor);
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'EVC',
      entityId: newEvc.id,
      action: 'EVC_SCHEDULED',
      newStatus: 'SCHEDULED',
      reason: `EVC inspection visit fixed for ${newEvc.visitDate}`,
      ipAddress: '127.0.0.1',
    });

    return newEvc;
  }

  updateEvcStatus(evcId: string, status: EVCSchedule['status'], reportNotes: string, checklist: EVCSchedule['deficiencyChecklist'], actor: User): EVCSchedule {
    const evc = this.evcSchedules.find(e => e.id === evcId);
    if (!evc) throw new Error('EVC schedule not found');

    const prevStatus = evc.status;
    evc.status = status;
    evc.reportNotes = reportNotes;
    evc.deficiencyChecklist = checklist;

    if (status === 'REPORT_SUBMITTED') {
      const app = this.getApplicationById(evc.appId);
      if (app) {
        app.prerequisitesMet.evcReportSubmitted = true;
      }
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'EVC',
      entityId: evc.id,
      action: 'EVC_REPORT_UPDATED',
      previousStatus: prevStatus,
      newStatus: status,
      reason: reportNotes,
      ipAddress: '127.0.0.1',
    });

    return evc;
  }

  // Undertakings & Compliance
  getUndertakings(): UndertakingObligation[] {
    return this.undertakings;
  }

  submitUndertakingDoc(id: string, fileName: string, fileUrl: string, actor: User): UndertakingObligation {
    const item = this.undertakings.find(u => u.id === id);
    if (!item) throw new Error('Undertaking requirement not found');

    item.status = 'SUBMITTED';
    item.submittedDocumentName = fileName;
    item.submittedDocumentUrl = fileUrl;
    item.submittedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'UNDERTAKING',
      entityId: item.id,
      action: 'UNDERTAKING_SUBMITTED',
      newStatus: 'SUBMITTED',
      reason: `Document ${fileName} uploaded against obligation ${item.title}`,
      ipAddress: '127.0.0.1',
    });

    return item;
  }

  verifyUndertaking(id: string, status: 'VERIFIED' | 'DEFICIENT', remarks: string, actor: User): UndertakingObligation {
    const item = this.undertakings.find(u => u.id === id);
    if (!item) throw new Error('Undertaking requirement not found');

    const prev = item.status;
    item.status = status;
    item.verifiedBy = actor.name;
    item.verifiedAt = new Date().toISOString();
    item.officerRemarks = remarks;

    // Check if all undertakings for application are verified
    if (item.appId) {
      const allAppUndertakings = this.undertakings.filter(u => u.appId === item.appId);
      const allCleared = allAppUndertakings.every(u => u.status === 'VERIFIED');
      const app = this.getApplicationById(item.appId);
      if (app) {
        app.prerequisitesMet.undertakingsCleared = allCleared;
      }
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'UNDERTAKING',
      entityId: item.id,
      action: 'UNDERTAKING_VERIFIED',
      previousStatus: prev,
      newStatus: status,
      reason: remarks,
      ipAddress: '127.0.0.1',
    });

    return item;
  }

  // Lease Documents
  getLeaseDocuments(): LeaseDocument[] {
    return this.leaseDocuments;
  }

  addOrUpdateLeaseDocument(docData: Partial<LeaseDocument>, actor: User): LeaseDocument {
    let doc = this.leaseDocuments.find(d => d.id === docData.id);
    if (!doc) {
      const id = `doc-${Date.now()}`;
      const expiryDate = docData.expiryDate || '2026-12-31';
      const daysRem = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      
      doc = {
        id,
        institutionId: docData.institutionId || 'inst-101',
        institutionName: docData.institutionName || 'Institution',
        region: docData.region || 'Northern Region (NRO)',
        documentType: docData.documentType || 'Land Lease Deed',
        documentNumber: docData.documentNumber || `DOC-${Date.now()}`,
        issuingAuthority: docData.issuingAuthority || 'Competent Authority',
        issueDate: docData.issueDate || '2020-01-01',
        expiryDate: expiryDate,
        daysRemaining: daysRem,
        renewalStatus: calculateExpiryWarningStatus(daysRem),
        fileUrl: docData.fileUrl,
        extractedAiFields: docData.extractedAiFields,
      };
      this.leaseDocuments.unshift(doc);
    } else {
      Object.assign(doc, docData);
      if (doc.expiryDate) {
        doc.daysRemaining = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
        doc.renewalStatus = calculateExpiryWarningStatus(doc.daysRemaining);
      }
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'LEASE_DOCUMENT',
      entityId: doc.id,
      action: 'LEASE_DOCUMENT_SAVED',
      reason: `Saved document ${doc.documentNumber} (${doc.documentType})`,
      ipAddress: '127.0.0.1',
    });

    return doc;
  }

  // System Notifications
  getNotifications(role?: UserRole, userId?: string): SystemNotification[] {
    let res = [...this.notifications];
    if (role && role !== 'SUPER_ADMIN') {
      res = res.filter(n => !n.recipientRole || n.recipientRole === role || n.recipientId === userId);
    }
    return res;
  }

  markNotificationRead(id: string): void {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.status = 'READ';
    }
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // Escalation Check Engine (called periodically or on request)
  runEscalationCheckEngine(): { newAlertsCount: number; escalatedAppsCount: number } {
    let newAlertsCount = 0;
    let escalatedAppsCount = 0;

    // 1. Check Applications SLA pendencies
    this.applications.forEach(app => {
      if (app.currentStage !== 'Completed' && app.currentStage !== 'Rejected') {
        const overdueDays = Math.max(0, app.daysPendingInCurrentStage - app.targetSlaDays);
        const rawLevel = calculateEscalationLevel(overdueDays);

        if (rawLevel > 0) {
          const level = rawLevel as 1 | 2 | 3;
          // Check if notification already generated for this application and level
          const exists = this.notifications.some(
            n => n.targetEntityId === app.id && n.escalationLevel === level && n.status !== 'RESOLVED'
          );

          if (!exists) {
            newAlertsCount++;
            escalatedAppsCount++;
            let recipientRole: UserRole = 'REGIONAL_OFFICER';
            if (level === 2) recipientRole = 'BUREAU_OFFICER';
            if (level === 3) recipientRole = 'SUPER_ADMIN';

            this.notifications.unshift({
              id: `notif-esc-${Date.now()}-${app.id}`,
              recipientRole: recipientRole,
              title: `Level ${level} Escalation: ${app.appNumber}`,
              message: `Application ${app.appNumber} (${app.institutionName}) is ${overdueDays} days past SLA target for stage '${app.currentStage}'.`,
              type: 'ESCALATION',
              escalationLevel: level,
              targetEntityId: app.id,
              targetEntityType: 'APPLICATION',
              status: 'UNREAD',
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // 2. Check Lease Document expiry alerts
    this.leaseDocuments.forEach(doc => {
      const daysRem = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      doc.daysRemaining = daysRem;
      doc.renewalStatus = calculateExpiryWarningStatus(daysRem);

      if (daysRem <= 30 && daysRem > 0) {
        const exists = this.notifications.some(
          n => n.targetEntityId === doc.id && n.type === 'LEASE_EXPIRY' && n.status !== 'RESOLVED'
        );
        if (!exists) {
          newAlertsCount++;
          this.notifications.unshift({
            id: `notif-doc-${Date.now()}-${doc.id}`,
            recipientRole: 'INSTITUTION_USER',
            title: `Document Expiry Warning: ${doc.documentType}`,
            message: `${doc.documentType} (${doc.documentNumber}) for ${doc.institutionName} expires in ${daysRem} days (${doc.expiryDate}). Renewal mandatory.`,
            type: 'LEASE_EXPIRY',
            targetEntityId: doc.id,
            targetEntityType: 'DOCUMENT',
            status: 'UNREAD',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    return { newAlertsCount, escalatedAppsCount };
  }
}

export const db = new Database();
