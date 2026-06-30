// be\src\modules\itam\assetFiles\assetFileService.js
import path from "path";
import db from "../../../models/index.js";
import writeAudit from "../../../core/utils/writeAudit.js";

const {
 AssetFile,
} = db;

const create = async (
 assetId,
 file,
 type,
 req
) => {
 if (!file) {
  throw new Error(
   "File required"
  );
 }

 const ext =
  path.extname(
   file.originalname
  );

 const data =
  await AssetFile.create({
   asset_id: assetId,
   file_type:
    type ||
    "OTHER",
   file_name:
    file.originalname,
   file_path:
    file.path,
   file_ext: ext,
   file_size:
    file.size,
   uploaded_by:
    req.user?.id ||
    null,
  });

 await writeAudit({
  req,
  moduleName:
   "ITAM",
  entityName:
   "ASSET_FILE",
  entityId:
   data.file_id,
  actionName:
   "UPLOAD_FILE",
  description:
   `Upload ${file.originalname}`,
 });

 return data;
};

const getByAssetId =
 async (
  assetId
 ) =>
  await AssetFile.findAll({
   where: {
    asset_id:
     assetId,
   },
   order: [
    [
     "file_id",
     "DESC",
    ],
   ],
  });

export default {
 create,
 getByAssetId,
};