// be\src\modules\cmms\workOrders\analytics\getAssetHealthStatus.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getAssetHealthStatus = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  order: [["created_at", "ASC"]],
 });

 if (!data.length) {
  return {
   asset_id: assetId,
   health_score: 100,
   risk_level: "GREEN",
   warning_flag: false,
   trend_status: "STABLE",
  };
 };

 let failure = 0;
 let downtime = 0;

 const trend = data.map((w) => {
  const start = w.start_date ? new Date(w.start_date) : null;
  const end = w.end_date ? new Date(w.end_date) : null;

  const duration =
   start && end ? (end - start) / 3600000 : 0;

  if (w.status === "FAILED") failure += 1;

  downtime += duration;

  return {
   id: w.wo_id,
   status: w.status,
   downtime,
  };
 });

 const failureRate = failure / data.length;
 const avgDowntime = downtime / data.length;

 // SCORE ENGINE
 let score = 100;

 score -= failureRate * 50;
 score -= avgDowntime * 2;

 if (score < 0) score = 0;

 // RISK ENGINE
 let risk_level = "GREEN";
 let warning_flag = false;
 let trend_status = "STABLE";

 if (score < 70) {
  risk_level = "YELLOW";
  warning_flag = true;
  trend_status = "DEGRADING";
 }

 if (score < 40) {
  risk_level = "RED";
  warning_flag = true;
  trend_status = "CRITICAL";
 }

 return {
  asset_id: assetId,
  total_wo: data.length,
  failure_rate: failureRate,
  avg_downtime: avgDowntime,
  health_score: Math.round(score),
  risk_level,
  warning_flag,
  trend_status,
  trend,
 };
};

export default getAssetHealthStatus;