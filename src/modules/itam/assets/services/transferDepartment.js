// be\src\modules\itam\assets\services\transferDepartment.js
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
  division,
  department,
 } = payload;

 if (!department) {
  throw new Error(
   "department required"
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
  division:
   division ||
   oldData.division,
  department,
 });

 await AssetLifecycle.create({
  asset_id:
   assetId,
  action_name:
   "TRANSFER_DEPT",
  from_location:
   oldData.department,
  to_location:
   department,
  notes:
   "Department transferred",
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
   "TRANSFER_DEPT",
  oldData: {
   division:
    oldData.division,
   department:
    oldData.department,
  },
  newData: {
   division,
   department,
  },
  description:
   "Transfer department",
 });

 return data;
}