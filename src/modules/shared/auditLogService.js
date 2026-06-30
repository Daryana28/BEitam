// be\src\modules\shared\auditLogService.js
import repository from "./auditLogRepository.js";

async function create(payload) {
  return repository.create(payload);
}

export default {
  create,
};