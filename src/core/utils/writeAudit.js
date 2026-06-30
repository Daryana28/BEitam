// be\src\core\utils\writeAudit.js
import auditLogService from "../../modules/shared/auditLogService.js";

export default async function writeAudit({
  req,
  moduleName,
  entityName,
  entityId,
  actionName,
  oldData = null,
  newData = null,
  description = "",
}) {
  try {
    await auditLogService.create({
      module_name: moduleName,
      entity_name: entityName,
      entity_id: entityId,
      action_name: actionName,
      old_data: oldData,
      new_data: newData,
      description,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      created_by: req.user?.user_id || null,
    });
  } catch {}
}