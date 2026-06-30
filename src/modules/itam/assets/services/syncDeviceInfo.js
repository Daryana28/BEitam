// be\src\modules\itam\assets\services\syncDeviceInfo.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const { Asset } = db;

export default async function (
 assetId,
 payload,
 req
) {
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

 const updated =
  await data.update({
   mac_address:
    payload.mac_address,
   operating_system:
    payload.operating_system,
   os_version:
    payload.os_version,
   is_domain_join:
    payload.is_domain_join,
   antivirus_status:
    payload.antivirus_status,
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
   "SYNC_DEVICE_INFO",
  oldData,
  newData:
   updated.toJSON(),
  description:
   "Sync device info",
 });

 return updated;
}