// be\src\modules\itam\assets\services\transferOwner.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const {
 Asset,
 AssetLifecycle,
} = db;

export default async function (
 assetId,
 payload,
 req
) {
 const {
  owner_name,
  nik,
 } = payload;

 if (!owner_name) {
  throw new Error(
   "owner_name required"
  );
 }

 const data =
  await Asset.findByPk(
   assetId
  );

 if (!data) {
  throw new Error(
   "Asset not found"
  );
 }

 const oldData =
  data.toJSON();

 await data.update({
  owner_name,
  nik:
   nik || null,
 });

 await AssetLifecycle.create({
  asset_id:
   assetId,
  action_name:
   "TRANSFER_OWNER",
  from_location:
   oldData.owner_name,
  to_location:
   owner_name,
  notes:
   "Owner transferred",
  created_by:
   req.user?.id ||
   null,
 });

 await writeAudit({
  req,
  moduleName:
   "ITAM",
  entityName:
   "ASSET",
  entityId:
   assetId,
  actionName:
   "TRANSFER_OWNER",
  oldData: {
   owner_name:
    oldData.owner_name,
   nik:
    oldData.nik,
  },
  newData: {
   owner_name,
   nik,
  },
  description:
   "Transfer asset owner",
 });

 return data;
}