// be\src\modules\shared\auditLogRepository.js
import db from "../../models/index.js";

const { AuditLog } = db;

async function create(payload) {
  return AuditLog.create(payload);
}

async function getAll(where = {}) {
  return AuditLog.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
}

export default {
  create,
  getAll,
};