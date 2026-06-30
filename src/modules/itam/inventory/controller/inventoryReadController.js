// be/src/modules/itam/inventory/controller/inventoryReadController.js
import inventoryService from "../services/index.js";

const getStockList = async (
 req,
 res
) => {
 try {
  const result =
   await inventoryService.getStockList(
    req.query
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

const getTransactionHistory =
 async (
  req,
  res
 ) => {
  try {
   const result =
    await inventoryService.getTransactionHistory(
     req.query
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
 getStockList,
 getTransactionHistory,
};