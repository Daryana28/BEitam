// be\src\modules\itam\assets\services\update.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import assetLifecycleRepository from "../../assetLifecycle/assetLifecycleRepository.js";
import { ensureCurrentCycleTimeline } from "./timeline.js";

const { Asset } = db;

export default async function (id, payload, req) {
 const data = await Asset.findByPk(id);

 if (!data) {
  throw new Error("Data not found");
 }

 const oldData = data.toJSON();
 const oldLocationId = data.location_id;
 const oldStatus = data.status;

 const updated = await db.sequelize.transaction(async (transaction) => {
  const saved = await data.update({
   ...payload,
  }, { transaction });

  await ensureCurrentCycleTimeline(saved, req, transaction);
  return saved;
 });

 if (
  String(oldLocationId || "") !==
  String(payload.location_id || "")
 ) {
  await assetLifecycleRepository.create({
   asset_id: id,
   action_name: "TRANSFERRED",
   from_location: String(oldLocationId || ""),
   to_location: String(payload.location_id || ""),
   notes: "Location changed",
   created_by: req?.user?.user_id || null,
  });
 }

 if (payload.status && payload.status !== oldStatus) {
  if (payload.status === "RETIRED") {
   await assetLifecycleRepository.create({
    asset_id: id,
    action_name: "RETIRED",
    notes: "Asset retired",
    created_by: req?.user?.user_id || null,
   });
  }

  if (payload.status === "REPAIR") {
   await assetLifecycleRepository.create({
    asset_id: id,
    action_name: "MAINTENANCE",
    notes: "Asset in repair",
    created_by: req?.user?.user_id || null,
   });
  }

  if (payload.status === "ACTIVE" && oldStatus === "REPAIR") {
   await assetLifecycleRepository.create({
    asset_id: id,
    action_name: "REPAIRED",
    notes: "Repair completed",
    created_by: req?.user?.user_id || null,
   });
  }
 }

 await writeAudit({
  req,
  moduleName: "ITAM",
  entityName: "ASSET",
  entityId: id,
  actionName: "UPDATE",
  oldData,
  newData: updated.toJSON(),
  description: "Update asset",
 });

 return updated;
}
