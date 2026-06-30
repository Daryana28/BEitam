// be/src/modules/itam/inventory/controller/inventoryWriteController.js
import inventoryService from "../services/index.js";

const stockIn = async (req, res) => {
 try {
  const result = await inventoryService.stockIn(req.body, req);

  return res.status(201).json({
   success: true,
   message: "Stock in success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const stockOut = async (req, res) => {
 try {
  const result = await inventoryService.stockOut(req.body, req);

  return res.status(201).json({
   success: true,
   message: "Stock out success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const adjustment = async (req, res) => {
 try {
  const result = await inventoryService.adjustment(req.body, req);

  return res.status(201).json({
   success: true,
   message: "Adjustment success",
   data: result,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

export default {
 stockIn,
 stockOut,
 adjustment,
};