// be\src\modules\itam\assets\controller\assetWriteController.js
// be/src/modules/itam/assets/controller/assetWriteController.js
import assetService from "../services/index.js";

const create = async (req, res) => {
 try {
  const result =
   await assetService.create(
    req.body,
    req
   );

  return res.status(201).json({
   success: true,
   message: "Created",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const update = async (req, res) => {
 try {
  const result =
   await assetService.update(
    req.params.id,
    req.body,
    req
   );

  return res.status(200).json({
   success: true,
   message: "Updated",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const remove = async (req, res) => {
 try {
  await assetService.remove(
   req.params.id,
   req
  );

  return res.status(200).json({
   success: true,
   message: "Deleted",
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const bulkImport = async (req, res) => {
 try {
  await assetService.bulkImport(
   req.body.rows,
   req
  );

  return res.status(200).json({
   success: true,
   message: "Import success",
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const bulkDelete = async (req, res) => {
 try {
  const deletedCount = await assetService.bulkDelete(
   req.body,
   req
  );

  return res.status(200).json({
   success: true,
   message: "Bulk delete success",
   data: {
    deleted_count: deletedCount,
   },
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const replace = async (req, res) => {
 try {
  const result = await assetService.replace(
   req.params.id,
   req.body,
   req
  );

  return res.status(200).json({
   success: true,
   message: "Replacement success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const renewSoftware = async (req, res) => {
 try {
  const result = await assetService.renewSoftware(
   req.params.id,
   req.body,
   req
  );

  return res.status(200).json({
   success: true,
   message: "Renewal success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const transferOwner = async (
 req,
 res
) => {
 try {
  const result =
   await assetService.transferOwner(
    req.params.id,
    req.body,
    req
   );

  return res.status(200).json({
   success: true,
   message:
    "Transfer owner success",
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

const changeAssignedUser =
 async (
  req,
  res
 ) => {
  try {
   const result =
    await assetService.changeAssignedUser(
     req.params.id,
     req.body,
     req
    );

   return res.status(200).json({
    success: true,
    message:
     "Change user success",
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

const transferDepartment =
 async (
  req,
  res
 ) => {
  try {
   const result =
    await assetService.transferDepartment(
     req.params.id,
     req.body,
     req
    );

   return res.status(200).json({
    success: true,
    message:
     "Transfer department success",
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

const moveLocation = async (
 req,
 res
) => {
 try {
  const result =
   await assetService.moveLocation(
    req.params.id,
    req.body,
    req
   );

  return res.status(200).json({
   success: true,
   message:
    "Move location success",
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

const generateQr = async (
 req,
 res
) => {
 try {
  const result =
   await assetService.generateQr(
    req.params.id
   );

  return res.status(200).json({
   success: true,
   message:
    "QR generated",
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

export default {
 create,
 update,
 remove,
 bulkImport,
 bulkDelete,
 replace,
 renewSoftware,
 transferOwner,
 changeAssignedUser,
 transferDepartment,
 moveLocation,
 generateQr,
};
