// be\src\seeders\permissionsAsset.js
import db from "../models/index.js";

const { Permission } = db;

const permissions = [
 "ViewAsset",
 "EditAsset",
 "DeleteAsset",
 "FinancialView",
 "AuditView",
];

export default async function SeedAssetPermissions() {
 for (const permissionName of permissions) {
  const exists = await Permission.findOne({
   where: {
    permission_name: permissionName,
   },
  });

  if (!exists) {
   await Permission.create({
    permission_name: permissionName,
   });
  }
 }
}