// Audit writer · fire-and-forget so a logging hiccup can never block or
// fail the admin action it describes. Call AFTER the action succeeded.
const { AuditEvent } = require('../models/audit-event.model');

function recordAudit(req, action, target = null, meta = null) {
  AuditEvent.create({
    actorId: req.user?.id ?? 'unknown',
    actorEmail: req.user?.email ?? null,
    action,
    target: target == null ? null : String(target),
    meta,
    ip: req.ip ?? null,
    at: new Date(),
  }).catch((err) => {
    console.error('[audit] write failed:', err.message);
  });
}

module.exports = { recordAudit };
