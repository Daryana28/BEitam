// be\src\modules\cmms\workOrders\analytics\getDashboardSummary.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

const getDashboardSummary = async () => {
 const data = await WorkOrder.findAll({
  order: [["created_at", "ASC"]],
 });

 const summary = {
  total_work_order: data.length,
  total_failed: 0,
  total_open: 0,
  total_closed: 0,
 };

 const monthlyMap = {};
 const assetMap = {};

 data.forEach((w) => {
  // STATUS SUMMARY
  if (w.status === "FAILED") summary.total_failed += 1;
  if (w.status === "OPEN") summary.total_open += 1;
  if (w.status === "CLOSED") summary.total_closed += 1;

  // MONTHLY HEATMAP
  const date = new Date(w.created_at);
  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

  if (!monthlyMap[monthKey]) {
   monthlyMap[monthKey] = 0;
  }
  monthlyMap[monthKey] += 1;

  // ASSET FREQUENCY
  if (!assetMap[w.asset_id]) {
   assetMap[w.asset_id] = 0;
  }
  assetMap[w.asset_id] += 1;
 });

 // TOP CRITICAL ASSETS
 const topAssets = Object.entries(assetMap)
  .map(([asset_id, count]) => ({
   asset_id,
   total_wo: count,
  }))
  .sort((a, b) => b.total_wo - a.total_wo)
  .slice(0, 10);

 // HEATMAP FORMAT
 const heatmap = Object.keys(monthlyMap).map((k) => ({
  month: k,
  total: monthlyMap[k],
 }));

 return {
  summary,
  top_assets: topAssets,
  heatmap,
 };
};

export default getDashboardSummary;