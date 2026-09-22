import { QueryTypes } from "sequelize";
import { sequelize } from "../../models/index.js";
import { flattenMenuPermissions, MENU_PERMISSION_TREE } from "./menuPermissionCatalog.js";

const TABLE_NAME = "dbo.user_menu_permissions";
const CONFIGURED_MARKER = "__configured";

let ensurePromise = null;

async function ensureTable() {
  if (!ensurePromise) {
    ensurePromise = sequelize.query(`
      IF OBJECT_ID('${TABLE_NAME}', 'U') IS NULL
      BEGIN
        CREATE TABLE ${TABLE_NAME} (
          user_id BIGINT NOT NULL,
          permission_key VARCHAR(150) NOT NULL,
          created_at DATETIME NOT NULL CONSTRAINT DF_user_menu_permissions_created_at DEFAULT GETDATE(),
          CONSTRAINT PK_user_menu_permissions PRIMARY KEY (user_id, permission_key),
          CONSTRAINT FK_user_menu_permissions_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE
        )
      END
    `);
  }

  return ensurePromise;
}

export async function getMenuPermissionTree() {
  await ensureTable();
  return MENU_PERMISSION_TREE;
}

export async function getAllowedPermissionKeys(userId) {
  if (!userId) return [];
  await ensureTable();

  const rows = await sequelize.query(
    `SELECT permission_key FROM ${TABLE_NAME} WHERE user_id = :userId ORDER BY permission_key ASC`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );

  return rows.map((row) => row.permission_key).filter((key) => key !== CONFIGURED_MARKER);
}

export async function getAllowedPermissionMap(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  await ensureTable();

  const rows = await sequelize.query(
    `SELECT user_id, permission_key FROM ${TABLE_NAME} WHERE user_id IN (:ids) ORDER BY permission_key ASC`,
    {
      replacements: { ids },
      type: QueryTypes.SELECT,
    }
  );

  const map = new Map(ids.map((id) => [String(id), { permissions: [], configured: false }]));
  rows.forEach((row) => {
    const key = String(row.user_id);
    if (!map.has(key)) map.set(key, { permissions: [], configured: false });
    if (row.permission_key === CONFIGURED_MARKER) {
      map.get(key).configured = true;
    } else {
      map.get(key).permissions.push(row.permission_key);
    }
  });

  return map;
}

export async function hasConfiguredMenuPermissions(userId) {
  if (!userId) return false;
  await ensureTable();

  const rows = await sequelize.query(
    `SELECT TOP 1 permission_key FROM ${TABLE_NAME} WHERE user_id = :userId AND permission_key = :marker`,
    {
      replacements: { userId, marker: CONFIGURED_MARKER },
      type: QueryTypes.SELECT,
    }
  );

  return rows.length > 0;
}

export async function setAllowedPermissionKeys(userId, permissionKeys = []) {
  if (!userId) return [];
  await ensureTable();

  const validKeys = new Set(flattenMenuPermissions().map((item) => item.key));
  const keys = [...new Set((permissionKeys || []).filter((key) => validKeys.has(key)))];

  const transaction = await sequelize.transaction();
  try {
    await sequelize.query(
      `DELETE FROM ${TABLE_NAME} WHERE user_id = :userId`,
      { replacements: { userId }, transaction }
    );

    for (const key of [CONFIGURED_MARKER, ...keys]) {
      await sequelize.query(
        `INSERT INTO ${TABLE_NAME} (user_id, permission_key) VALUES (:userId, :key)`,
        { replacements: { userId, key }, transaction }
      );
    }

    await transaction.commit();
    return keys;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function clearAllowedPermissionKeys(userId) {
  if (!userId) return [];
  await ensureTable();

  await sequelize.query(
    `DELETE FROM ${TABLE_NAME} WHERE user_id = :userId`,
    { replacements: { userId } }
  );

  return [];
}
