import { Router } from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import { getAllowedPermissionKeys } from "../user/userMenuPermissionService.js";
import { getFileSharingOverview } from "./fileSharingController.js";
import {
 captureSnapshot,
 getCurrentSizes,
 getGrowthHistory,
 getOverview,
} from "./databaseMonitoringController.js";
import {
 getServerStorageOverview,
 receiveServerStorageSnapshot,
 saveServerStorageNote,
} from "./serverStorageController.js";

const router = Router();
const STORAGE_PERMISSION_KEY = "databaseMonitoring";
const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN", "SUPERADMINISTRATOR"]);

const storageAccess = async (req, res, next) => {
 const roles = (req.user?.roles || []).map((role) => String(role).toUpperCase());

 if (roles.some((role) => ADMIN_ROLES.has(role))) {
  return next();
 }

 const tokenPermissions = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
 if (tokenPermissions.includes(STORAGE_PERMISSION_KEY)) {
  return next();
 }

 try {
  const userId = req.user?.id || req.user?.user_id;
  const allowedKeys = await getAllowedPermissionKeys(userId);

  if (allowedKeys.includes(STORAGE_PERMISSION_KEY)) {
   return next();
  }

  return res.status(403).json({ success: false, message: "Forbidden" });
 } catch (error) {
  return next(error);
 }
};

router.get("/file-sharing", authMiddleware, storageAccess, getFileSharingOverview);
router.get("/server-storage/overview", authMiddleware, storageAccess, getServerStorageOverview);
router.put("/server-storage/notes", authMiddleware, storageAccess, saveServerStorageNote);
router.post("/server-storage/snapshots", receiveServerStorageSnapshot);
router.get("/overview", authMiddleware, storageAccess, getOverview);
router.get("/current", authMiddleware, storageAccess, getCurrentSizes);
router.get("/history", authMiddleware, storageAccess, getGrowthHistory);
router.post("/snapshots", authMiddleware, storageAccess, captureSnapshot);

export default router;
