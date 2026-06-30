// be\src\modules\itsm\incidents\incidentService.js
import db from "../../../models/index.js";

const { incident } = db;

const getAll = async (query) => {
  const where = {};

  if (query.search) {
    where.title = query.search;
  }

  return await incident.findAll({
    where,
    order: [["id", "DESC"]],
  });
};

const getById = async (id) => {
  return await incident.findByPk(id);
};

const create = async (payload, user) => {
  return await incident.create({
    ...payload,
    created_by: user?.id || null,
    updated_by: user?.id || null,
  });
};

const update = async (id, payload, user) => {
  const data = await incident.findByPk(id);

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
  const data = await incident.findByPk(id);

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