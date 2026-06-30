// be\src\modules\itam\assetFiles\assetFileController.js
import assetFileService from "./assetFileService.js";

const upload = async (
 req,
 res
) => {
 try {
  const result =
   await assetFileService.create(
    req.params.id,
    req.file,
    req.body.file_type,
    req
   );

  return res.status(201).json({
   success: true,
   message:
    "Upload success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message:
    error.message,
  });
 }
};

const getByAssetId =
 async (
  req,
  res
 ) => {
  try {
   const result =
    await assetFileService.getByAssetId(
     req.params.id
    );

   return res.status(200).json({
    success: true,
    data: result,
   });
  } catch (error) {
   return res.status(500).json({
    success: false,
    message:
     error.message,
   });
  }
 };

export default {
 upload,
 getByAssetId,
};