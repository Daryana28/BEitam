import { sequelize } from "../../models/index.js";

let userColumnCache = null;

const normalizeColumnMap = (columns = {}) =>
  Object.keys(columns).reduce((acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  }, {});

export const getUserColumnMap = async () => {
  if (!userColumnCache) {
    const table = await sequelize.getQueryInterface().describeTable("users");
    userColumnCache = normalizeColumnMap(table);
  }

  return userColumnCache;
};

export const getExistingUserColumns = async (columns = []) => {
  const columnMap = await getUserColumnMap();
  return columns.filter((column) => Boolean(columnMap[column.toLowerCase()]));
};

export const pickExistingUserPayload = async (payload = {}) => {
  const existingColumns = await getExistingUserColumns(Object.keys(payload));
  return existingColumns.reduce((acc, key) => {
    if (payload[key] !== undefined) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

export const hasUserColumn = async (columnName) => {
  const columnMap = await getUserColumnMap();
  return Boolean(columnMap[columnName.toLowerCase()]);
};

