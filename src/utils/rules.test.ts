import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateApplicationRisk, validateStageTransition, calculateExpiryWarningStatus, calculateEscalationLevel } from './rules.ts';
import { Application } from '../types/index.ts';

test('calculateApplicationRisk computes correct risk levels', () => {
  assert.equal(calculateApplicationRisk(2, 14, 0, 'Under Scrutiny'), 'LOW');
  assert.equal(calculateApplicationRisk(12, 14, 1, 'Under Scrutiny'), 'MEDIUM');
  assert.equal(calculateApplicationRisk(18, 14, 2, 'Under Scrutiny'), 'HIGH');
  assert.equal(calculateApplicationRisk(35, 14, 0, 'Under Scrutiny'), 'CRITICAL');
  assert.equal(calculateApplicationRisk(50, 14, 0, 'Completed'), 'LOW');
});

test('calculateExpiryWarningStatus identifies correct threshold buckets', () => {
  assert.equal(calculateExpiryWarningStatus(45), 'ACTIVE');
  assert.equal(calculateExpiryWarningStatus(25), 'WARNING_30_DAYS');
  assert.equal(calculateExpiryWarningStatus(12), 'WARNING_15_DAYS');
  assert.equal(calculateExpiryWarningStatus(4), 'WARNING_7_DAYS');
  assert.equal(calculateExpiryWarningStatus(0), 'EXPIRED');
  assert.equal(calculateExpiryWarningStatus(-5), 'EXPIRED');
});

test('calculateEscalationLevel triggers appropriate escalation tiers', () => {
  assert.equal(calculateEscalationLevel(1), 0);
  assert.equal(calculateEscalationLevel(4), 1);
  assert.equal(calculateEscalationLevel(8), 2);
  assert.equal(calculateEscalationLevel(15), 3);
});

test('validateStageTransition prevents transition if prerequisites unfulfilled', () => {
  const dummyApp: Application = {
    id: 'app-1',
    appNumber: 'APP-101',
    institutionId: 'inst-1',
    institutionName: 'Delhi Institute of Tech',
    region: 'Northern Region (NRO)',
    applicationType: 'Extension of Approval (EoA)',
    submissionDate: '2026-10-01',
    targetSlaDays: 14,
    currentStage: 'Under Scrutiny',
    workflowType: 'SCRUTINY_EVC',
    prerequisitesMet: {
      documentsVerified: false,
      feePaid: true,
      evcReportSubmitted: false,
      sacApproved: false,
      undertakingsCleared: false,
    },
    riskLevel: 'MEDIUM',
    daysPendingInCurrentStage: 5,
    stageHistory: [],
    updatedAt: '2026-10-26',
  };

  const result = validateStageTransition(dummyApp, 'EVC Scheduled', 'REGIONAL_OFFICER');
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /Prerequisite failed/);

  // Mark documents as verified
  dummyApp.prerequisitesMet.documentsVerified = true;
  const result2 = validateStageTransition(dummyApp, 'EVC Scheduled', 'REGIONAL_OFFICER');
  assert.equal(result2.allowed, true);
});
