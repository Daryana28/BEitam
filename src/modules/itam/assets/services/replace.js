import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import assetLifecycleRepository from "../../assetLifecycle/assetLifecycleRepository.js";
import {
 copyTimelineHistory,
 ensureCurrentCycleTimeline,
 TIMELINE_ACTIONS,
} from "./timeline.js";

const { sequelize, Asset } = db;

function formatDateOnly(value) {
 if (!value) return null;

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
  throw new Error("Tanggal replacement tidak valid");
 }

 return date.toISOString().slice(0, 10);
}

function addSixYears(value) {
 const date = new Date(value);
 date.setFullYear(date.getFullYear() + 6);
 return date.toISOString().slice(0, 10);
}

export default async function replaceAsset(id, payload, req) {
 const replacementDate = formatDateOnly(payload?.replacement_date);
 const newAssetCode = String(payload?.new_asset_code || "").trim();

 if (!replacementDate) {
  throw new Error("Tanggal replacement wajib diisi");
 }

 if (!newAssetCode) {
  throw new Error("No asset baru wajib diisi");
 }

 const existingCode = await Asset.findOne({
  where: { asset_code: newAssetCode },
 });

 if (existingCode) {
  throw new Error("No asset baru sudah digunakan");
 }

 const currentAsset = await Asset.findByPk(id);
 if (!currentAsset) {
  throw new Error("Data asset tidak ditemukan");
 }

 const oldData = currentAsset.toJSON();
 const nextDepreciationDate = addSixYears(replacementDate);
 const now = new Date();

 return await sequelize.transaction(async (transaction) => {
  await currentAsset.update(
   {
    status: "DISPOSED",
   },
   { transaction }
  );

  const clonedData = {
   ...oldData,
   asset_id: undefined,
   asset_code: newAssetCode,
   purchase_date: replacementDate,
   depreciation_date: nextDepreciationDate,
   status: "ACTIVE",
   hostname: payload?.new_hostname || oldData.hostname || null,
   ip_main: payload?.new_ip_main || oldData.ip_main || null,
   ip_backup: payload?.new_ip_backup || oldData.ip_backup || null,
   created_at: now,
  };

  delete clonedData.asset_id;

  const createdAsset = await Asset.create(clonedData, { transaction });

  await assetLifecycleRepository.create({
   asset_id: currentAsset.asset_id,
   action_name: TIMELINE_ACTIONS.REPLACED,
   notes: `Asset replaced by ${createdAsset.asset_code} on ${replacementDate}. ${payload?.reason || ""}`.trim(),
   created_by: req?.user?.user_id || null,
   created_at: `${replacementDate}T00:00:00.000Z`,
  }, { transaction });

  await copyTimelineHistory(currentAsset.asset_id, createdAsset.asset_id, transaction);

  await assetLifecycleRepository.create({
   asset_id: createdAsset.asset_id,
   action_name: "PROCURED",
   notes: `Replacement asset created from ${oldData.asset_code} on ${replacementDate}.`,
   created_by: req?.user?.user_id || null,
  }, { transaction });

  await ensureCurrentCycleTimeline(createdAsset, req, transaction);

  await writeAudit({
   req,
   moduleName: "ITAM",
   entityName: "ASSET",
   entityId: currentAsset.asset_id,
   actionName: "REPLACE_OLD_ASSET",
   oldData,
   newData: currentAsset.toJSON(),
   description: `Replace old asset with ${createdAsset.asset_code}`,
  });

  await writeAudit({
   req,
   moduleName: "ITAM",
   entityName: "ASSET",
   entityId: createdAsset.asset_id,
   actionName: "REPLACE_NEW_ASSET",
   newData: createdAsset.toJSON(),
   description: `Create replacement asset from ${oldData.asset_code}`,
  });

  return {
   old_asset: currentAsset,
   new_asset: createdAsset,
  };
 });
}
