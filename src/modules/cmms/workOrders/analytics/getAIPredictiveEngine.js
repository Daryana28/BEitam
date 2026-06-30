// be\src\modules\cmms\workOrders\analytics\getAIPredictiveEngine.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getAIPredictiveEngine = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  order: [["created_at", "ASC"]],
 });

 if (!data.length) {
  return {
   failure_probability: 0,
   priority_score: 100,
   anomaly_flag: false,
   next_failure_estimation_days: null,
  };
 }

 let failures = 0;
 let totalDowntime = 0;
 let intervals = [];

 let lastDate = null;

 data.forEach((w) => {
  const start = w.start_date ? new Date(w.start_date) : null;
  const end = w.end_date ? new Date(w.end_date) : null;

  if (w.status === "FAILED") failures++;

  if (start && end) {
   totalDowntime += (end - start) / 3600000;
  }

  if (lastDate) {
   intervals.push((start - lastDate) / 86400000);
  }

  lastDate = start;
 });

 // FAILURE PROBABILITY
 const failure_probability = failures / data.length;

 // AVG INTERVAL (days)
 const avgInterval =
  intervals.length > 0
   ? intervals.reduce((a, b) => a + b, 0) / intervals.length
   : 30;

 // DOWNTIME IMPACT
 const downtimeImpact = totalDowntime / data.length;

 // AI-LIKE SCORE MODEL
 let priority_score = 100;

 priority_score -= failure_probability * 60;
 priority_score -= downtimeImpact * 2;

 if (priority_score < 0) priority_score = 0;

 // ANOMALY DETECTION
 const anomaly_flag =
  failure_probability > 0.4 || downtimeImpact > 10;

 // NEXT FAILURE ESTIMATION
 const next_failure_estimation_days =
  avgInterval * (1 - failure_probability);

 return {
  asset_id: assetId,
  failure_probability: Number(failure_probability.toFixed(2)),
  priority_score: Math.round(priority_score),
  anomaly_flag,
  next_failure_estimation_days: Math.round(
   next_failure_estimation_days
  ),
 };
};

export default getAIPredictiveEngine;