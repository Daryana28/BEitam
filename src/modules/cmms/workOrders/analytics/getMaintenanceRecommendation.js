// be\src\modules\cmms\workOrders\analytics\getMaintenanceRecommendation.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getMaintenanceRecommendation = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  order: [["created_at", "DESC"]],
 });

 let failed = 0;
 let total = data.length;

 data.forEach((w) => {
  if (w.status === "FAILED") failed += 1;
 });

 const failureRate = total ? failed / total : 0;

 let recommendation = "NO_ACTION";
 let priority = "LOW";

 if (failureRate > 0.3) {
  recommendation = "CREATE_WORK_ORDER";
  priority = "HIGH";
 }

 if (failureRate > 0.5) {
  recommendation = "IMMEDIATE_REPAIR";
  priority = "CRITICAL";
 }

 return {
  asset_id: assetId,
  failure_rate: failureRate,
  recommendation,
  priority,
 };
};

export default getMaintenanceRecommendation;