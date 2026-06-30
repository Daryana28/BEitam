// be\src\modules\cmms\workOrders\analytics\getCMMSOptimizationEngine.js
import db from "../../../../models/index.js";

const { WorkOrder, User } = db;

const getCMMSOptimizationEngine = async () => {
 const wo = await WorkOrder.findAll({
  order: [["created_at", "DESC"]],
 });

 const users = await User.findAll();

 // =========================
 // WORKLOAD ANALYSIS
 // =========================
 const workload = {};

 users.forEach((u) => {
  workload[u.id] = {
   user_id: u.id,
   name: u.name,
   total_task: 0,
  };
 });

 wo.forEach((w) => {
  if (w.assigned_to) {
   if (!workload[w.assigned_to]) {
    workload[w.assigned_to] = {
     user_id: w.assigned_to,
     total_task: 0,
    };
   }

   workload[w.assigned_to].total_task += 1;
  }
 });

 // =========================
 // COST ESTIMATION
 // =========================
 let totalCost = 0;

 wo.forEach((w) => {
  let base = 100;

  if (w.priority === "HIGH") base += 200;
  if (w.priority === "CRITICAL") base += 500;

  if (w.status === "FAILED") base += 150;

  totalCost += base;
 });

 // =========================
 // SLA RISK
 // =========================
 const overdue = wo.filter((w) => {
  if (!w.end_date) return false;

  const diff =
   new Date() - new Date(w.end_date);

  return diff > 0;
 }).length;

 const slaRisk =
  overdue / (wo.length || 1);

 let sla_status = "SAFE";

 if (slaRisk > 0.3) sla_status = "WARNING";
 if (slaRisk > 0.5) sla_status = "CRITICAL";

 // =========================
 // BUDGET FORECAST
 // =========================
 const monthlyCost = totalCost / 12;

 return {
  total_work_order: wo.length,
  estimated_total_cost: totalCost,
  estimated_monthly_budget: monthlyCost,
  sla_risk: slaRisk,
  sla_status,
  workload: Object.values(workload),
 };
};

export default getCMMSOptimizationEngine;