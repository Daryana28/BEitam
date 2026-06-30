import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import { Op } from "sequelize";

const {
 Asset,
 sequelize,
} = db;

export default async function (
 payload = {},
 req
) {
 const assetIds = Array.isArray(payload.asset_ids)
  ? payload.asset_ids.map((id) => String(id).trim()).filter(Boolean)
  : [];

 const categoryIds = Array.isArray(payload.category_ids)
  ? payload.category_ids.map((id) => String(id).trim()).filter(Boolean)
  : [];

 if (!categoryIds.length && !assetIds.length) {
  throw new Error("Category ids or asset ids required");
 }

 const trx = await sequelize.transaction();

 try {
  const deletedCount = await Asset.destroy({
   where: assetIds.length
    ? {
       asset_id: {
        [Op.in]: assetIds,
       },
      }
    : {
       category_id: {
        [Op.in]: categoryIds,
       },
      },
   transaction: trx,
  });

  await trx.commit();

  await writeAudit({
   req,
   moduleName: "ITAM",
   entityName: "ASSET",
   entityId: 0,
   actionName: "BULK_DELETE",
   description: assetIds.length
    ? `Delete assets by ids: ${assetIds.join(", ")} (${deletedCount} rows)`
    : `Delete assets by categories: ${categoryIds.join(", ")} (${deletedCount} rows)`,
  });

  return deletedCount;
 } catch (error) {
  try {
   await trx.rollback();
  } catch {
   // noop
  }
  throw error;
 }
}
