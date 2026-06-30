// be\src\modules\itam\assets\services\getById.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const {
 Asset,
 AssetCategory,
 AssetLocation,
} = db;

const include = [
 {
  model: AssetCategory,
  as: "category",
  required: false,
 },
 {
  model: AssetLocation,
  as: "location",
  required: false,
 },
];

export default async function (
 id,
 req
) {
 const data =
  await Asset.findByPk(
   id,
   {
    include,
   }
  );

 if (data && req) {
  await writeAudit({
   req,
   moduleName:
    "ITAM",
   entityName:
    "ASSET",
   entityId: id,
   actionName:
    "VIEW",
   description:
    "View asset detail",
  });
 }

 return data;
}