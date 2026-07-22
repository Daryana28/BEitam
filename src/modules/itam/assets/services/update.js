// be\src\modules\itam\assets\services\update.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import assetLifecycleRepository from "../../assetLifecycle/assetLifecycleRepository.js";
import { ensureCurrentCycleTimeline, TIMELINE_ACTIONS } from "./timeline.js";

const { Asset, AssetLifecycle } = db;

function normalizeDateOnly(value) {
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;

 return date.toISOString().slice(0, 10);
}

async function createManualTimelineHistory(assetId, status, eventDate, createdBy, transaction) {
 const normalizedStatus = String(status || "").trim().toUpperCase();
 const normalizedDate = normalizeDateOnly(eventDate);

 if (!assetId || !normalizedStatus || !normalizedDate) return;

 const actionName = normalizedStatus === "NEW"
  ? TIMELINE_ACTIONS.NEW
  : normalizedStatus === "PLANNING"
   ? TIMELINE_ACTIONS.PLANNING
   : null;

 if (!actionName) return;

 const notes = `TIMELINE_MANUAL_${normalizedStatus}`;
 const createdAt = `${normalizedDate}T00:00:00.000Z`;

 const existing = await AssetLifecycle.findOne({
  where: {
   asset_id: assetId,
   action_name: actionName,
   notes,
   created_at: createdAt,
  },
  transaction,
 });

 if (existing) return;

 await assetLifecycleRepository.create({
  asset_id: assetId,
  action_name: actionName,
  notes,
  created_by: createdBy,
  created_at: createdAt,
 }, { transaction });
}

export default async function (id, payload, req) {
 const data = await Asset.findByPk(id);

 if (!data) {
  throw new Error("Data not found");
 }

 const oldData = data.toJSON();
 const oldLocationId = data.location_id;
 const oldStatus = data.status;
 const {
  timeline_status: timelineStatus,
  timeline_event_date: timelineEventDate,
  ...assetPayload
 } = payload || {};

 const updated = await db.sequelize.transaction(async (transaction) => {
  const saved = await data.update({
   ...assetPayload,
  }, { transaction });

  await ensureCurrentCycleTimeline(saved, req, transaction);
  await createManualTimelineHistory(
   id,
   timelineStatus,
   timelineEventDate,
   req?.user?.user_id || null,
   transaction
  );
  return saved;
 });

 if (
  String(oldLocationId || "") !==
  String(assetPayload.location_id || "")
 ) {
  await assetLifecycleRepository.create({
   asset_id: id,
   action_name: "TRANSFERRED",
   from_location: String(oldLocationId || ""),
   to_location: String(assetPayload.location_id || ""),
   notes: "Location changed",
   created_by: req?.user?.user_id || null,
  });
 }

 if (assetPayload.status && assetPayload.status !== oldStatus) {
  if (assetPayload.status === "RETIRED") {
   await assetLifecycleRepository.create({
    asset_id: id,
    action_name: "RETIRED",
    notes: "Asset retired",
    created_by: req?.user?.user_id || null,
   });
  }

  if (assetPayload.status === "REPAIR") {
   await assetLifecycleRepository.create({
    asset_id: id,
    action_name: "MAINTENANCE",
    notes: "Asset in repair",
    created_by: req?.user?.user_id || null,
   });
  }

  if (assetPayload.status === "ACTIVE" && oldStatus === "REPAIR") {
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
