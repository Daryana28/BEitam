// be\src\modules\itam\assets\services\moveLocation.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const {
 Asset,
 AssetLocation,
 AssetLifecycle,
} = db;

export default async function (
 assetId,
 payload,
 req
) {
 const {
  location_id,
 } = payload;

 if (!location_id) {
  throw new Error(
   "location_id required"
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

 const newLoc =
  await AssetLocation.findByPk(
   location_id
  );

 if (!newLoc) {
  throw new Error(
   "Location not found"
  );
 }

 const oldLoc =
  data.location_id
   ? await AssetLocation.findByPk(
      data.location_id
     )
   : null;

 const oldData =
  data.toJSON();

 await data.update({
  location_id,
 });

 await AssetLifecycle.create({
  asset_id:
   assetId,
  action_name:
   "MOVE_LOCATION",
  from_location:
   oldLoc
    ?.location_name ||
   null,
  to_location:
   newLoc.location_name,
  notes:
   "Asset moved location",
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
   "MOVE_LOCATION",
  oldData: {
   location_id:
    oldData.location_id,
  },
  newData: {
   location_id,
  },
  description:
   `Move to ${newLoc.location_name}`,
 });

 return data;
}