// be\src\seeders\rolesPermissionsSeeder.js
import db from "../models/index.js";

const {
 Role,
 Permission,
 RolePermission,
} = db;

const rolePermissionsMap = [
 {
  role: "SUPERADMIN",
  permissions: [
   "ViewAsset",
   "EditAsset",
   "DeleteAsset",
   "FinancialView",
   "AuditView",
  ],
 },
 {
  role: "ADMIN",
  permissions: [
   "ViewAsset",
   "EditAsset",
   "AuditView",
  ],
 },
 {
  role: "FINANCE",
  permissions: [
   "ViewAsset",
   "FinancialView",
  ],
 },
 {
  role: "USER",
  permissions: [
   "ViewAsset",
  ],
 },
];

export default async function SeedRolesPermissions() {
 for (const item of rolePermissionsMap) {
  const role =
   await Role.findOne({
    where: {
     role_name:
      item.role,
    },
  });

  if (!role) continue;

  for (const permName of item.permissions) {
   const permission =
    await Permission.findOne({
     where: {
      permission_name:
       permName,
     },
    });

   if (!permission) continue;

   const exists =
    await RolePermission.findOne({
     where: {
      role_id:
       role.role_id,
      permission_id:
       permission.permission_id,
     },
    });

   if (!exists) {
    await RolePermission.create({
     role_id:
      role.role_id,
     permission_id:
      permission.permission_id,
    });
   }
  }
 }
}