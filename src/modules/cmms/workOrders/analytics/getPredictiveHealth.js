// be\src\modules\cmms\workOrders\analytics\getPredictiveHealth.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getPredictiveHealth = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
 });

 const total = data.length;
 const failed = data.filter(
  (w) => w.status === "FAILED"
 ).length;

 const failureRate = total ? failed / total : 0;

 // downtime detection
 let totalDowntime = 0;

 data.forEach((w) => {
  const start = w.start_date ? new Date(w.start_date) : null;
  const end = w.end_date ? new Date(w.end_date) : null;

  if (start && end) {
   totalDowntime += (end - start) / 3600000;
  }
 });

 // SCORE ENGINE
 let score = 100;

 score -= failureRate * 60;
 score -= totalDowntime * 0.5;

 if (score < 0) score = 0;

 // RISK ENGINE
 let risk = "LOW";
 let warning = false;
 let reason = [];

 if (failureRate > 0.3) {
  risk = "HIGH";
  warning = true;
  reason.push("High failure rate");
 }

 if (totalDowntime > 20) {
  risk = "HIGH";
  warning = true;
  reason.push("High downtime");
 }

 if (score < 70) {
  risk = "MEDIUM";
  warning = true;
  reason.push("Low health score");
 }

 return {
  asset_id: assetId,
  total_work_order: total,
  total_failed: failed,
  failure_rate: failureRate,
  total_downtime_hours: totalDowntime,
  health_score: Math.round(score),
  risk_level: risk,
  warning_flag: warning,
  reason,
 };
};

export default getPredictiveHealth;