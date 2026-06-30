// be\src\modules\cmms\workOrders\services\workOrderAutoService.js
import db from "../../../../models/index.js";

const { WorkOrder, User } = db;

const createAutoWorkOrder = async (assetId, reason) => {
 const technician = await User.findOne({
  where: { role: "TECH" },
 });

 return await WorkOrder.create({
  asset_id: assetId,
  title: `AUTO MAINTENANCE - ${reason}`,
  status: "OPEN",
  priority: "HIGH",
  assigned_to: technician?.id || null,
  request_by: 1,
 });
};

export default {
 createAutoWorkOrder,
};