import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { extractDocumentFields, executeNaturalLanguageQuery } from './src/server/gemini.ts';
import { validateStageTransition } from './src/utils/rules.ts';
import { UserRole, ApplicationStage } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get active user from header or fallback
function getActorFromRequest(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || 'user-admin';
  const user = db.getUserById(userId) || db.getUsers()[0];
  return user;
}

// ---------------- API ROUTES ----------------

// Users & Auth
app.get('/api/users', (req: Request, res: Response) => {
  res.json({ users: db.getUsers() });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Workflows
app.get('/api/workflows', (req: Request, res: Response) => {
  res.json({ workflows: db.getWorkflows() });
});

app.put('/api/workflows/:id', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Admin can modify workflow definitions.' });
  }
  const updatedWf = db.updateWorkflow(req.body, actor);
  res.json({ workflow: updatedWf });
});

// Applications
app.get('/api/applications', (req: Request, res: Response) => {
  const { region, stage, risk, search } = req.query;
  const apps = db.getApplications({
    region: region as string,
    stage: stage as string,
    risk: risk as string,
    search: search as string,
  });
  res.json({ applications: apps });
});

app.get('/api/applications/:id', (req: Request, res: Response) => {
  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: 'Application not found' });
  }
  res.json({ application: appItem });
});

app.post('/api/applications', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const newApp = db.createApplication(req.body, actor);
  res.status(201).json({ application: newApp });
});

app.post('/api/applications/:id/stage', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const { nextStage, actionType, reason } = req.body; // actionType: 'ADVANCE' | 'REVERT_DEFICIENCY'

  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Validate stage transition prerequisites unless reverting for deficiency
  if (actionType === 'ADVANCE') {
    const check = validateStageTransition(appItem, nextStage as ApplicationStage, actor.role);
    if (!check.allowed) {
      return res.status(400).json({ error: check.reason });
    }
  }

  if (actionType === 'REVERT_DEFICIENCY' && !reason) {
    return res.status(400).json({ error: 'Mandatory deficiency reason is required when returning an application.' });
  }

  const updatedApp = db.updateApplicationStage(appItem.id, nextStage, actionType, reason || '', actor);
  res.json({ application: updatedApp });
});

app.post('/api/applications/:id/prerequisites', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const { key, value } = req.body;
  const updatedApp = db.updatePrerequisite(req.params.id, key, Boolean(value), actor);
  res.json({ application: updatedApp });
});

// EVC Schedules
app.get('/api/evc', (req: Request, res: Response) => {
  res.json({ schedules: db.getEvcSchedules() });
});

app.post('/api/evc', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const newEvc = db.createEvcSchedule(req.body, actor);
  res.status(201).json({ schedule: newEvc });
});

app.put('/api/evc/:id', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const { status, reportNotes, deficiencyChecklist } = req.body;
  const updated = db.updateEvcStatus(req.params.id, status, reportNotes, deficiencyChecklist, actor);
  res.json({ schedule: updated });
});

// Compliance & Undertakings
app.get('/api/compliance/undertakings', (req: Request, res: Response) => {
  res.json({ undertakings: db.getUndertakings() });
});

app.post('/api/compliance/undertakings/:id/submit', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const { fileName, fileUrl } = req.body;
  const updated = db.submitUndertakingDoc(req.params.id, fileName || 'document.pdf', fileUrl || '#', actor);
  res.json({ undertaking: updated });
});

app.post('/api/compliance/undertakings/:id/verify', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const { status, remarks } = req.body; // status: 'VERIFIED' | 'DEFICIENT'
  const updated = db.verifyUndertaking(req.params.id, status, remarks || '', actor);
  res.json({ undertaking: updated });
});

// Lease & Document Expiry Tracker
app.get('/api/lease-documents', (req: Request, res: Response) => {
  res.json({ documents: db.getLeaseDocuments() });
});

app.post('/api/lease-documents', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const doc = db.addOrUpdateLeaseDocument(req.body, actor);
  res.json({ document: doc });
});

// Notifications & Escalation
app.get('/api/notifications', (req: Request, res: Response) => {
  const actor = getActorFromRequest(req);
  const notifs = db.getNotifications(actor.role, actor.id);
  const unreadCount = notifs.filter(n => n.status === 'UNREAD').length;
  res.json({ notifications: notifs, unreadCount });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/run-escalations', (req: Request, res: Response) => {
  const result = db.runEscalationCheckEngine();
  res.json({ result });
});

// Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

// CSV Report Export
app.get('/api/reports/csv', (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'applications';
  let csvData = '';

  if (type === 'applications') {
    csvData = 'Application Number,Institution Name,Region,Type,Current Stage,Risk Level,Pending Days,Submission Date\n';
    db.getApplications().forEach(appItem => {
      csvData += `"${appItem.appNumber}","${appItem.institutionName}","${appItem.region}","${appItem.applicationType}","${appItem.currentStage}","${appItem.riskLevel}",${appItem.daysPendingInCurrentStage},"${appItem.submissionDate}"\n`;
    });
  } else if (type === 'evc') {
    csvData = 'Application Number,Institution Name,Region,Scheduled Date,Visit Date,Status,Report Notes\n';
    db.getEvcSchedules().forEach(evc => {
      csvData += `"${evc.appNumber}","${evc.institutionName}","${evc.region}","${evc.scheduledDate}","${evc.visitDate}","${evc.status}","${(evc.reportNotes || '').replace(/"/g, '""')}"\n`;
    });
  } else if (type === 'lease_expiries') {
    csvData = 'Institution Name,Region,Document Type,Document Number,Issue Date,Expiry Date,Days Remaining,Status\n';
    db.getLeaseDocuments().forEach(doc => {
      csvData += `"${doc.institutionName}","${doc.region}","${doc.documentType}","${doc.documentNumber}","${doc.issueDate}","${doc.expiryDate}",${doc.daysRemaining},"${doc.renewalStatus}"\n`;
    });
  } else {
    csvData = 'Timestamp,Actor Name,Actor Role,Action,Entity Type,Entity ID,Previous Status,New Status,Reason\n';
    db.getAuditLogs().forEach(aud => {
      csvData += `"${aud.timestamp}","${aud.actorName}","${aud.actorRole}","${aud.action}","${aud.entityType}","${aud.entityId}","${aud.previousStatus || ''}","${aud.newStatus || ''}","${(aud.reason || '').replace(/"/g, '""')}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="AICTE_${type}_report.csv"`);
  res.send(csvData);
});

// AI Document OCR Field Extraction Endpoint
app.post('/api/ai/extract-document', async (req: Request, res: Response) => {
  const { fileContent, fileName, mimeType, expectedInstitutionName, expectedDocumentNumber } = req.body;
  if (!fileContent || !fileName) {
    return res.status(400).json({ error: 'fileContent and fileName are required' });
  }

  const actor = getActorFromRequest(req);
  const extractionResult = await extractDocumentFields(
    fileContent, 
    fileName, 
    mimeType || 'text/plain',
    { institutionName: expectedInstitutionName, documentNumber: expectedDocumentNumber }
  );

  db.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    entityType: 'AI_EXTRACTION',
    entityId: fileName,
    action: 'AI_OCR_EXTRACTION_PERFORMED',
    reason: `Extracted fields for ${fileName}. Confidence Score: ${extractionResult.confidenceScore}`,
    ipAddress: '127.0.0.1',
  });

  res.json({ extractionResult });
});

// AI Natural Language Query Endpoint
app.post('/api/ai/nl-query', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'query string is required' });
  }

  const contextData = {
    applications: db.getApplications(),
    evcSchedules: db.getEvcSchedules(),
    undertakings: db.getUndertakings(),
    leaseDocuments: db.getLeaseDocuments(),
  };

  const result = await executeNaturalLanguageQuery(query, contextData);
  res.json({ result });
});

// Run background escalation engine every 120 seconds
setInterval(() => {
  db.runEscalationCheckEngine();
}, 120000);

// Initialize Vite Dev Server in development or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AICTE Integrated Approval Workflow System running at http://localhost:${PORT}`);
  });
}

startServer();
