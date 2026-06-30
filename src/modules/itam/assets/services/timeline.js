import db from "../../../../models/index.js";

const { AssetLifecycle } = db;

export const TIMELINE_ACTIONS = {
 NEW: "NEW",
 PLANNING: "PLANNING",
 REPLACED: "REPLACED",
};

export function normalizeDateOnly(value) {
 if (!value) return null;
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;
 return date.toISOString().slice(0, 10);
}

function toDateTimeValue(dateOnly) {
 return `${dateOnly}T00:00:00.000Z`;
}

async function findLifecycleBySignature(assetId, actionName, notes, transaction) {
 return await AssetLifecycle.findOne({
  where: {
   asset_id: assetId,
   action_name: actionName,
   notes,
  },
  transaction,
 });
}

export async function upsertTimelineEvent({
 assetId,
 actionName,
 eventDate,
 notes,
 createdBy = null,
 transaction,
}) {
 const normalizedDate = normalizeDateOnly(eventDate);
 if (!assetId || !normalizedDate) return null;

 const existing = await findLifecycleBySignature(
  assetId,
  actionName,
  notes,
  transaction
 );

 if (existing) {
  await existing.update(
   {
    created_at: toDateTimeValue(normalizedDate),
    created_by: createdBy,
   },
   { transaction }
  );
  return existing;
 }

 return await AssetLifecycle.create(
  {
   asset_id: assetId,
   action_name: actionName,
   notes,
   created_by: createdBy,
   created_at: toDateTimeValue(normalizedDate),
  },
  { transaction }
 );
}

export async function ensureCurrentCycleTimeline(asset, req, transaction) {
 if (!asset?.asset_id) return;

 await upsertTimelineEvent({
  assetId: asset.asset_id,
  actionName: TIMELINE_ACTIONS.NEW,
  eventDate: asset.purchase_date,
  notes: "CURRENT_CYCLE_NEW",
  createdBy: req?.user?.user_id || null,
  transaction,
 });

 await upsertTimelineEvent({
  assetId: asset.asset_id,
  actionName: TIMELINE_ACTIONS.PLANNING,
  eventDate: asset.depreciation_date,
  notes: "CURRENT_CYCLE_PLANNING",
  createdBy: req?.user?.user_id || null,
  transaction,
 });
}

export async function copyTimelineHistory(sourceAssetId, targetAssetId, transaction) {
 if (!sourceAssetId || !targetAssetId) return;

 const existingHistory = await AssetLifecycle.findAll({
  where: {
   asset_id: sourceAssetId,
   action_name: Object.values(TIMELINE_ACTIONS),
  },
  order: [["created_at", "ASC"], ["lifecycle_id", "ASC"]],
  transaction,
 });

 for (const item of existingHistory) {
  const historyNotes = `HISTORY_COPY_FROM:${sourceAssetId}:${item.lifecycle_id}`;
  const alreadyCopied = await findLifecycleBySignature(
   targetAssetId,
   item.action_name,
   historyNotes,
   transaction
  );

  if (alreadyCopied) continue;

  await AssetLifecycle.create(
   {
    asset_id: targetAssetId,
    action_name: item.action_name,
    notes: historyNotes,
    created_by: item.created_by || null,
    created_at: item.created_at,
   },
   { transaction }
  );
 }
}
