// Audit event · append-only trail of admin actions.
//
// Every mutation and bulk PII export in the admin panel records who did
// what, to what, from where, when. GDPR accountability for the customer
// exports (they exist for email marketing) and plain operational
// forensics for order/price changes. Never updated, never deleted by
// application code.
const { mongoose } = require('../db/db');

const auditEventSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true },
    actorEmail: { type: String, default: null },
    // Dotted verb, e.g. "order.status", "product.update", "export.customers".
    action: { type: String, required: true, index: true },
    // Id/slug of the thing acted on; null for bulk actions like exports.
    target: { type: String, default: null },
    // Small free-form context (new status, changed field names, ...).
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    at: { type: Date, default: Date.now, index: true },
  },
  { collection: 'audit_events', versionKey: false }
);

module.exports = {
  AuditEvent:
    mongoose.models.AuditEvent ||
    mongoose.model('AuditEvent', auditEventSchema),
};
