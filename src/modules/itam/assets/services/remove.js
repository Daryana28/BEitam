// be\src\modules\itam\assets\services\remove.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import assetLifecycleRepository from "../../assetLifecycle/assetLifecycleRepository.js";

const {
 Asset,
} = db;

export default async function (
 id,
 req
) {
 const data =
  await Asset.findByPk(
   id
  );

 if (!data) {
  throw new Error(
   "Data not found"
  );
 }

 const oldData =
  data.toJSON();

 await assetLifecycleRepository.create({
  asset_id: id,
  action_name:
   "DISPOSED",
  notes:
   "Asset deleted/disposed",
  created_by:
   req?.user
    ?.user_id ||
   null,
 });

 await data.destroy();

 await writeAudit({
  req,
  moduleName:
   "ITAM",
  entityName:
   "ASSET",
  entityId: id,
  actionName:
   "DELETE",
  oldData,
  description:
   "Delete asset",
 });

 return true;
}