import { Router } from "express";

import authMiddleware from "../../../middlewares/authMiddleware.js";
import {
 viewTrackedImage,
 getMonitoringRecords,
} from "./phishingMonitoringController.js";

const router = Router();

router.get("/view/phishing-warning", viewTrackedImage);
router.get("/records", authMiddleware, getMonitoringRecords);

export default router;
