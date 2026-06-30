// be\src\modules\cmms\workOrders\services\getFailureScore.js
import db from "../../../models/index.js";

const { WorkOrder } = db;

const getFailureScore = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
 });

 const total = data.length;

 const failed = data.filter(
  (w) => w.status === "FAILED"
 ).length;

 const failureRate =
  total > 0 ? failed / total : 0;

 let score = 100;

 // penalti failure
 score -= failureRate * 60;

 // minimal clamp
 if (score < 0) score = 0;

 let risk = "LOW";
 if (score < 70) risk = "MEDIUM";
 if (score < 40) risk = "HIGH";

 return {
  total_work_order: total,
  total_failed: failed,
  failure_rate: failureRate,
  health_score: Math.round(score),
  risk_level: risk,
 };
};
