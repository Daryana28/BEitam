// be/src/modules/itsm/tickets/ticketService.js
import db from "../../../models/index.js";
import writeAudit from "../../../core/utils/writeAudit.js";

const {
 Ticket,
} = db;

const getAll = async (
 query = {}
) => {
 const where = {};

 if (query.search) {
  where.title =
   query.search;
 }

 return await Ticket.findAll({
  where,
  order: [
   [
    "ticket_id",
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
  await Ticket.findByPk(
   id
  );

 if (data) {
  await writeAudit({
   req,
   moduleName:
    "ITSM",
   entityName:
    "TICKET",
   entityId: id,
   actionName:
    "VIEW",
   description:
    "View ticket detail",
  });
 }

 return data;
};

const create = async (
 payload,
 req
) => {
 const data =
  await Ticket.create({
   ...payload,
   requester_id:
    req.user?.id ||
    null,
  });

 await writeAudit({
  req,
  moduleName:
   "ITSM",
  entityName:
   "TICKET",
  entityId:
   data.ticket_id,
  actionName:
   "CREATE",
  newData:
   payload,
  description:
   "Create ticket",
 });

 return data;
};

const update = async (
 id,
 payload,
 req
) => {
 const data =
  await Ticket.findByPk(
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
   "ITSM",
  entityName:
   "TICKET",
  entityId: id,
  actionName:
   "UPDATE",
  oldData,
  newData:
   payload,
  description:
   "Update ticket",
 });

 return data;
};

const remove = async (
 id,
 req
) => {
 const data =
  await Ticket.findByPk(
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
   "ITSM",
  entityName:
   "TICKET",
  entityId: id,
  actionName:
   "DELETE",
  oldData,
  description:
   "Delete ticket",
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