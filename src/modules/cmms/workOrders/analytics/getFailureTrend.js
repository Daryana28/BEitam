// be\src\modules\cmms\workOrders\services\getFailureTrend.js
import db from "../../../models/index.js";

const { WorkOrder } = db;

const getFailureTrend = async (assetId) => {
 const data = await WorkOrder.findAll({
  where: { asset_id: assetId },
  attributes: [
   "wo_id",
   "status",
   "start_date",
   "end_date",
   "created_at",
  ],
  order: [["created_at", "ASC"]],
 });

 // GROUP BY BULAN
 const monthly = {};

 data.forEach((item) => {
  const date = new Date(item.created_at);
  const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

  if (!monthly[key]) {
   monthly[key] = {
    total: 0,
    failed: 0,
    downtime: 0,
   };
  }

  const start = item.start_date ? new Date(item.start_date) : null;
  const end = item.end_date ? new Date(item.end_date) : null;

  const downtime =
   start && end ? (end - start) / 3600000 : 0;

  monthly[key].total += 1;

  if (item.status === "FAILED") {
   monthly[key].failed += 1;
  }

  monthly[key].downtime += downtime;
 });

 // FORMAT OUTPUT
 return Object.keys(monthly).map((key) => {
  const m = monthly[key];

  return {
   period: key,
   total_wo: m.total,
   failed_wo: m.failed,
   failure_rate:
    m.total > 0 ? m.failed / m.total : 0,
   downtime_hours: m.downtime,
  };
 });
};