// be\src\modules\itam\assets\services\changeAssignedUser.js
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
  division,
  department,
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
  division:
   division ||
   null,
  department:
   department ||
   null,
 });

 await AssetLifecycle.create({
  asset_id:
   assetId,
  action_name:
   "CHANGE_USER",
  from_location:
   oldData.owner_name,
  to_location:
   owner_name,
  notes:
   "Assigned user changed",
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
   "CHANGE_USER",
  oldData: {
   owner_name:
    oldData.owner_name,
   nik:
    oldData.nik,
   division:
    oldData.division,
   department:
    oldData.department,
  },
  newData: {
   owner_name,
   nik,
   division,
   department,
  },
  description:
   "Change assigned user",
 });

 return data;
}