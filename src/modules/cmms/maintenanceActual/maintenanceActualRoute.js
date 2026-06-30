import express from "express";
import { createActualEntry, upsertAndSetStatus, updateActualStatus } from "./maintenanceActualController.js";
import { submitAbnormalLog } from "../maintenanceAbnormalLog/maintenanceAbnormalLogController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createActualEntry);
router.post("/upsert", upsertAndSetStatus);
router.put("/:id/status", updateActualStatus);
router.post("/:id/abnormal", submitAbnormalLog);

export default router;
