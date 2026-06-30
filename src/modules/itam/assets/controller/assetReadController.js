// be\src\modules\itam\assets\controller\assetReadController.js
// be/src/modules/itam/assets/controller/assetReadController.js
import assetService from "../services/index.js";
import assetLifecycleService from "../../assetLifecycle/assetLifecycleService.js";

const getAll = async (req, res) => {
 try {
  const result =
   await assetService.getAll(
    req.query
   );

  return res.status(200).json({
   success: true,
   message: "Success",
   data: result.rows,
   meta: {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
   },
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getNextCode = async (req, res) => {
 try {
  const result =
   await assetService.getNextCode();

  return res.status(200).json({
   success: true,
   message: "Success",
   data: {
    asset_code: result,
   },
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getById = async (req, res) => {
 try {
  const result =
   await assetService.getById(
    req.params.id,
    req
   );

  if (!result) {
   return res.status(404).json({
    success: false,
    message: "Data not found",
   });
  }

  return res.status(200).json({
   success: true,
   message: "Success",
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getHistory = async (req, res) => {
 try {
  const result =
   await assetService.getHistory(
    req.params.id
   );

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getLifecycle = async (req, res) => {
 try {
  const result =
   await assetLifecycleService.getByAssetId(
    req.params.id
   );

  return res.status(200).json({
   success: true,
   message: "Success",
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

export default {
 getAll,
 getNextCode,
 getById,
 getHistory,
 getLifecycle,
};