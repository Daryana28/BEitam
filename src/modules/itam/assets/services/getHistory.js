// be\src\modules\itam\assets\services\getHistory.js
import db from "../../../../models/index.js";

const {
 AuditLog,
} = db;

export default async function (
 id
) {
 return await AuditLog.findAll({
  where: {
   module_name:
    "ITAM",
   ref_id: id,
  },
  order: [
   [
    "created_at",
    "DESC",
   ],
  ],
 });
}