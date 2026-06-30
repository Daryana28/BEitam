// be\src\modules\cmms\workOrders\analytics\getAutonomousMaintenanceEngine.js
import db from "../../../../models/index.js";

const { WorkOrder, User } = db;

const getAutonomousMaintenanceEngine = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  order: [["created_at", "ASC"]],
 });

 if (!data.length) {
  return {
   action: "NO_ACTION",
   confidence: 0,
  };
 }

 let failures = 0;
 let downtime = 0;

 data.forEach((w) => {
  if (w.status === "FAILED") failures++;

  const start = w.start_date ? new Date(w.start_date) : null;
  const end = w.end_date ? new Date(w.end_date) : null;

  if (start && end) {
   downtime += (end - start) / 3600000;
  }
 });

 const failureRate = failures / data.length;

 // DECISION ENGINE
 let action = "MONITOR";
 let priority = "LOW";
 let confidence = 50;

 if (failureRate > 0.5) {
  action = "AUTO_CREATE_WORK_ORDER";
  priority = "CRITICAL";
  confidence = 95;
 }

 if (failureRate > 0.3) {
  action = "SCHEDULE_MAINTENANCE";
  priority = "HIGH";
  confidence = 80;
 }

 if (downtime > 20) {
  action = "ESCALATE_ENGINEER";
  priority = "HIGH";
  confidence = 85;
 }

 return {
  asset_id: assetId,
  failure_rate: Number(failureRate.toFixed(2)),
  total_downtime: downtime,
  action,
  priority,
  confidence,
 };
};

export default getAutonomousMaintenanceEngine;