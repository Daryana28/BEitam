import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import assetLifecycleRepository from "../../assetLifecycle/assetLifecycleRepository.js";

const { Asset } = db;

function normalizeType(value = "") {
 return String(value || "").trim();
}

function addMonths(date, amount) {
 const next = new Date(`${date}T00:00:00`);
 next.setMonth(next.getMonth() + amount);
 return next.toISOString().slice(0, 10);
}

function addYears(date, amount) {
 const next = new Date(`${date}T00:00:00`);
 next.setFullYear(next.getFullYear() + amount);
 return next.toISOString().slice(0, 10);
}

function calculateNextRenewal(renewDate, type) {
 if (!renewDate) return null;

 if (type === "Monthly") {
  return addMonths(renewDate, 1);
 }

 if (type === "Yearly") {
  return addYears(renewDate, 1);
 }

 return null;
}

export default async function renewSoftware(id, payload = {}, req) {
 const data = await Asset.findByPk(id);

 if (!data) {
  throw new Error("Data not found");
 }

 const oldData = data.toJSON();
 const type = normalizeType(payload.type || oldData.operating_system || oldData.type || "Yearly");
 const renewDate = payload.renew_date || new Date().toISOString().slice(0, 10);
 const nextRenewal = type === "Permanen"
  ? null
  : payload.next_renewal || calculateNextRenewal(renewDate, type);
 const qty = payload.qty ?? oldData.mac_address ?? null;
 const vendor = payload.vendor ?? oldData.owner_name ?? null;
 const notes = payload.notes || "Software license renewed";

 const updated = await db.sequelize.transaction(async (transaction) => {
  const saved = await data.update({
   operating_system: type,
   mac_address: qty,
   owner_name: vendor,
   os_version: renewDate,
   depreciation_date: nextRenewal,
   antivirus_status: type === "Permanen" ? "Seumur Hidup" : nextRenewal,
   status: "ACTIVE",
  }, { transaction });

  await assetLifecycleRepository.create({
   asset_id: id,
   action_name: "RENEWAL",
   notes,
   created_by: req?.user?.user_id || null,
  }, { transaction });

  return saved;
 });

 await writeAudit({
  req,
  moduleName: "ITAM",
  entityName: "ASSET",
  entityId: id,
  actionName: "RENEWAL",
  oldData,
  newData: updated.toJSON(),
  description: "Renew software license",
 });

 return updated;
}
