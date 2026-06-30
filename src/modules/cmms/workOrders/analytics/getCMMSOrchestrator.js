// be\src\modules\cmms\workOrders\analytics\getCMMSOrchestrator.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getCMMSOrchestrator = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  order: [["created_at", "ASC"]],
 });

 if (!data.length) {
  return {
   status: "IDLE",
   action: "NO_DATA",
  };
 }

 let failure = 0;
 let downtime = 0;

 data.forEach((w) => {
  if (w.status === "FAILED") failure++;

  const start = w.start_date ? new Date(w.start_date) : null;
  const end = w.end_date ? new Date(w.end_date) : null;

  if (start && end) {
   downtime += (end - start) / 3600000;
  }
 });

 const failureRate = failure / data.length;

 // =========================
 // DECISION ENGINE (ORCHESTRATOR)
 // =========================
 let action = "MONITOR";
 let status = "STABLE";

 if (failureRate > 0.6) {
  action = "AUTO_CREATE_WORK_ORDER";
  status = "CRITICAL";
 }

 if (failureRate > 0.4) {
  action = "SCHEDULE_PREVENTIVE_MAINTENANCE";
  status = "WARNING";
 }

 if (downtime > 30) {
  action = "SELF_HEAL_TRIGGER";
  status = "CRITICAL";
 }

 // =========================
 // LOOP SCORE RE-EVALUATION
 // =========================
 let score = 100;

 score -= failureRate * 70;
 score -= downtime * 2;

 if (score < 0) score = 0;

 return {
  asset_id: assetId,
  failure_rate: Number(failureRate.toFixed(2)),
  downtime_hours: downtime,
  system_score: Math.round(score),
  status,
  action,
 };
};

export default getCMMSOrchestrator;