// be/src/modules/cmms/workOrders/services/workOrderService.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const {
 WorkOrder,
} = db;

const getAll = async (
 query = {}
) => {
 return await WorkOrder.findAll({
  where: {},
  order: [
   [
    "wo_id",
    "DESC",
   ],
  ],
 });
};

const getById = async (
 id,
 req
) => {
 const data =
  await WorkOrder.findByPk(
   id
  );

 if (data) {
  await writeAudit({
   req,
   moduleName:
    "CMMS",
   entityName:
    "WORK_ORDER",
   entityId: id,
   actionName:
    "VIEW",
   description:
    "View work order",
  });
 }

 return data;
};

const create = async (
 payload,
 req
) => {
 const data =
  await WorkOrder.create({
   ...payload,
   request_by:
    req.user?.id ||
    null,
  });

 await writeAudit({
  req,
  moduleName:
   "CMMS",
  entityName:
   "WORK_ORDER",
  entityId:
   data.wo_id,
  actionName:
   "CREATE",
  newData:
   payload,
  description:
   "Create work order",
 });

 return data;
};

const update = async (
 id,
 payload,
 req
) => {
 const data =
  await WorkOrder.findByPk(
   id
  );

 if (!data) {
  throw new Error(
   "Data not found"
  );
 }

 const oldData =
  data.toJSON();

 await data.update(
  payload
 );

 await writeAudit({
  req,
  moduleName:
   "CMMS",
  entityName:
   "WORK_ORDER",
  entityId: id,
  actionName:
   "UPDATE",
  oldData,
  newData:
   payload,
  description:
   "Update work order",
 });

 return data;
};

const remove = async (
 id,
 req
) => {
 const data =
  await WorkOrder.findByPk(
   id
  );

 if (!data) {
  throw new Error(
   "Data not found"
  );
 }

 const oldData =
  data.toJSON();

 await data.destroy();

 await writeAudit({
  req,
  moduleName:
   "CMMS",
  entityName:
   "WORK_ORDER",
  entityId: id,
  actionName:
   "DELETE",
  oldData,
  description:
   "Delete work order",
 });

 return true;
};

export default {
 getAll,
 getById,
 create,
 update,
 remove,
};