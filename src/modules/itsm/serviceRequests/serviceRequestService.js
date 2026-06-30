// be\src\modules\itsm\serviceRequests\serviceRequestService.js
import db from "../../../models/index.js";

const { ticket } = db;

const getAll = async (query) => {
  const where = {
    type: "service_request",
  };

  if (query.search) {
    where.title = query.search;
  }

  return await ticket.findAll({
    where,
    order: [["id", "DESC"]],
  });
};

const getById = async (id) => {
  return await ticket.findOne({
    where: {
      id,
      type: "service_request",
    },
  });
};

const create = async (payload, user) => {
  return await ticket.create({
    ...payload,
    type: "service_request",
    created_by: user?.id || null,
    updated_by: user?.id || null,
  });
};

const update = async (id, payload, user) => {
  const data = await ticket.findOne({
    where: {
      id,
      type: "service_request",
    },
  });

  if (!data) {
    throw new Error("Data not found");
  }

  await data.update({
    ...payload,
    updated_by: user?.id || null,
  });

  return data;
};

const remove = async (id) => {
  const data = await ticket.findOne({
    where: {
      id,
      type: "service_request",
    },
  });

  if (!data) {
    throw new Error("Data not found");
  }

  await data.destroy();

  return true;
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};