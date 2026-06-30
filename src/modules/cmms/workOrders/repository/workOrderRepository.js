// be\src\modules\cmms\workOrders\repository\workOrderRepository.js
import db from "../../../../models/index.js";

const { WorkOrder } = db;

/* =========================
   FIND ALL
========================= */
const FindAll = async (query = {}) => {
 const where = {};

 if (query.asset_id) {
  where.asset_id = query.asset_id;
 }

 if (query.status) {
  where.status = query.status;
 }

 return await WorkOrder.findAll({
  where,
  order: [["wo_id", "DESC"]],
 });
};

/* =========================
   FIND BY ID
========================= */
const FindById = async (id) => {
 return await WorkOrder.findByPk(id);
};

/* =========================
   CREATE
========================= */
const Create = async (payload) => {
 return await WorkOrder.create(payload);
};

/* =========================
   UPDATE
========================= */
const Update = async (id, payload) => {
 const data = await WorkOrder.findByPk(id);

 if (!data) {
  throw new Error("WorkOrder not found");
 }

 return await data.update(payload);
};

/* =========================
   DELETE
========================= */
const Delete = async (id) => {
 const data = await WorkOrder.findByPk(id);

 if (!data) {
  throw new Error("WorkOrder not found");
 }

 await data.destroy();
 return true;
};

export default {
 FindAll,
 FindById,
 Create,
 Update,
 Delete,
};