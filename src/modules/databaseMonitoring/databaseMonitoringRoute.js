import { Router } from "express";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";
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
} from "./serverStorageController.js";

const router = Router();
const adminOnly = roleMiddleware("ADMIN", "SUPERADMIN", "SUPERADMINISTRATOR");

router.get("/file-sharing", authMiddleware, adminOnly, getFileSharingOverview);
router.get("/server-storage/overview", authMiddleware, adminOnly, getServerStorageOverview);
router.post("/server-storage/snapshots", receiveServerStorageSnapshot);
router.get("/overview", authMiddleware, adminOnly, getOverview);
router.get("/current", authMiddleware, adminOnly, getCurrentSizes);
router.get("/history", authMiddleware, adminOnly, getGrowthHistory);
router.post("/snapshots", authMiddleware, adminOnly, captureSnapshot);

export default router;
