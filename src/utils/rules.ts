import { Application, ApplicationStage, RiskLevel, UserRole } from '../types';

/**
 * Calculates risk level based on pending days vs SLA target,
 * incomplete prerequisites, and stage history.
 */
export function calculateApplicationRisk(
  daysPending: number,
  targetSlaDays: number,
  unmetPrereqsCount: number,
  stage: ApplicationStage
): RiskLevel {
  if (stage === 'Completed' || stage === 'Rejected') {
    return 'LOW';
  }

  const overdueRatio = daysPending / Math.max(1, targetSlaDays);

  if (overdueRatio >= 2.0 || daysPending > 30) {
    return 'CRITICAL';
  }
  if (overdueRatio >= 1.25 || (daysPending > 15 && unmetPrereqsCount > 1)) {
    return 'HIGH';
  }
  if (overdueRatio >= 0.8 || unmetPrereqsCount > 0) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Determines whether an application can transition to the requested next stage
 * based on role authorization and prerequisite completeness.
 */
export function validateStageTransition(
  app: Application,
  nextStage: ApplicationStage,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  // Super admin can override, but let's check normal rules
  if (actorRole === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  if (app.currentStage === 'Completed' || app.currentStage === 'Rejected') {
    return { allowed: false, reason: 'Application is already closed.' };
  }

  // Check stage specific required prerequisites
  if (nextStage === 'EVC Pending' || nextStage === 'EVC Scheduled') {
    if (!app.prerequisitesMet.documentsVerified) {
      return { allowed: false, reason: 'Prerequisite failed: Scrutiny & document verification must be completed first.' };
    }
    if (!app.prerequisitesMet.feePaid) {
      return { allowed: false, reason: 'Prerequisite failed: Application fee payment must be confirmed.' };
    }
  }

  if (nextStage === 'Awaiting SAC/SHC') {
    if (app.workflowType.includes('EVC') && !app.prerequisitesMet.evcReportSubmitted) {
      return { allowed: false, reason: 'Prerequisite failed: Expert Visit Committee (EVC) report must be uploaded.' };
    }
  }

  if (nextStage === 'Completed') {
    if (!app.prerequisitesMet.documentsVerified) {
      return { allowed: false, reason: 'Prerequisite failed: Document verification pending.' };
    }
    if (!app.prerequisitesMet.undertakingsCleared) {
      return { allowed: false, reason: 'Prerequisite failed: Mandatory undertakings & compliance affidavits not cleared.' };
    }
  }

  return { allowed: true };
}

/**
 * Calculates lease / document expiry status category based on remaining days.
 */
export function calculateExpiryWarningStatus(daysRemaining: number): 'ACTIVE' | 'WARNING_30_DAYS' | 'WARNING_15_DAYS' | 'WARNING_7_DAYS' | 'EXPIRED' {
  if (daysRemaining <= 0) return 'EXPIRED';
  if (daysRemaining <= 7) return 'WARNING_7_DAYS';
  if (daysRemaining <= 15) return 'WARNING_15_DAYS';
  if (daysRemaining <= 30) return 'WARNING_30_DAYS';
  return 'ACTIVE';
}

/**
 * Calculates escalation level based on overdue days beyond SLA.
 */
export function calculateEscalationLevel(overdueDays: number): 1 | 2 | 3 | 0 {
  if (overdueDays >= 14) return 3; // Bureau Head
  if (overdueDays >= 7) return 2;  // Regional Head
  if (overdueDays >= 3) return 1;  // Direct Officer Reminder
  return 0;
}
