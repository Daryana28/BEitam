// be\src\modules\cmms\workOrders\services\getAssetAnalytics.js
import db from "../../../models/index.js";

const { WorkOrder } = db;

const getAssetAnalytics = async (assetId) => {
 const wo = await WorkOrder.findAll({
  where: {
   asset_id: assetId,
  },
  order: [["created_at", "ASC"]],
 });

 let totalDowntime = 0;

 const mapped = wo.map((w) => {
  const start = new Date(w.start_time);
  const end = w.end_time ? new Date(w.end_time) : null;

  const downtime =
   end && start ? (end - start) / 3600000 : 0;

  totalDowntime += downtime;

  return {
   id: w.id,
   status: w.status,
   start_time: w.start_time,
   end_time: w.end_time,
   downtime_hours: downtime,
  };
 });

 const mttr =
  wo.length > 0 ? totalDowntime / wo.length : 0;

 const mtbf =
  wo.length > 1
   ? totalDowntime / (wo.length - 1)
   : 0;

 return {
  total_work_order: wo.length,
  total_downtime_hours: totalDowntime,
  mttr,
  mtbf,
  logs: mapped,
 };
};