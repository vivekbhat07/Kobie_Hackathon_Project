import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listTemplates,
  getTemplate,
  renderManifest,
  slugify,
  isValidSeverity,
  isValidDeploymentName,
} from '../services/templates.js';
import { commitFile, deleteFile, alertFilePath } from '../services/github.js';

const router = Router();

// All alert routes require a valid JWT.
router.use(requireAuth);

// GET /alerts/templates — the predefined templates the UI offers.
router.get('/templates', (_req, res) => {
  res.json({ templates: listTemplates() });
});

// GET /alerts — alerts created by the current user only.
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, alert_name, deployment_name, alert_type, severity, threshold, file_path, created_at
         FROM alerts
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ alerts: rows });
  } catch (err) {
    console.error('list alerts failed:', err);
    res.status(500).json({ error: 'Could not load alerts.' });
  }
});

// POST /alerts — create an alert, generate YAML, commit to the GitOps repo.
router.post('/', async (req, res) => {
  const alertName = String(req.body?.alertName || '').trim();
  const deploymentName = String(req.body?.deploymentName || '').trim();
  const templateId = String(req.body?.templateId || req.body?.alertType || '').trim();
  const severity = String(req.body?.severity || '').trim().toLowerCase();
  const threshold =
    req.body?.threshold === undefined || req.body?.threshold === null
      ? ''
      : String(req.body.threshold).trim();

  // Validation
  if (!alertName) return res.status(400).json({ error: 'Alert name is required.' });
  const tpl = getTemplate(templateId);
  if (!tpl) return res.status(400).json({ error: 'Unknown alert template.' });
  if (!isValidDeploymentName(deploymentName)) {
    return res.status(400).json({
      error: 'Deployment name must be lowercase letters, numbers and dashes.',
    });
  }
  if (!isValidSeverity(severity)) {
    return res.status(400).json({ error: 'Severity must be critical, warning or info.' });
  }
  if (tpl.usesThreshold && threshold && !/^\d+(\.\d+)?$/.test(threshold)) {
    return res.status(400).json({ error: 'Threshold must be a number.' });
  }

  let insertedId = null;
  try {
    // 1. Insert first so we have a stable id for unique file naming.
    const placeholder = `${alertFilePath(slugify(alertName))}.pending`;
    const insert = await query(
      `INSERT INTO alerts
         (user_id, alert_name, deployment_name, alert_type, severity, threshold, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [req.user.id, alertName, deploymentName, templateId, severity, threshold || null, placeholder]
    );
    insertedId = insert.rows[0].id;

    // 2. Build unique names and the manifest.
    const metadataName = `${slugify(alertName)}-${insertedId}`;
    const fileName = `${metadataName}.yaml`;
    const path = alertFilePath(fileName);
    const manifest = renderManifest({
      templateId,
      alertName,
      metadataName,
      deploymentName,
      severity,
      threshold,
    });

    // 3. Commit to Git.
    await commitFile(path, manifest, `chore(alerts): add ${fileName} via Alert Portal`);

    // 4. Persist the real path.
    const updated = await query(
      `UPDATE alerts SET file_path = $1 WHERE id = $2
       RETURNING id, alert_name, deployment_name, alert_type, severity, threshold, file_path, created_at`,
      [path, insertedId]
    );

    res.status(201).json({ alert: updated.rows[0] });
  } catch (err) {
    console.error('create alert failed:', err);
    // Roll back the DB row if the commit failed.
    if (insertedId) {
      await query('DELETE FROM alerts WHERE id = $1', [insertedId]).catch(() => {});
    }
    res.status(500).json({ error: 'Could not create the alert.' });
  }
});

// DELETE /alerts/:id — remove the YAML from Git and the record from the DB.
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid alert id.' });
  }

  try {
    const { rows } = await query(
      'SELECT id, file_path FROM alerts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    const { file_path: path } = rows[0];
    await deleteFile(path, `chore(alerts): remove ${path} via Alert Portal`);
    await query('DELETE FROM alerts WHERE id = $1', [id]);

    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    console.error('delete alert failed:', err);
    res.status(500).json({ error: 'Could not delete the alert.' });
  }
});

export default router;
