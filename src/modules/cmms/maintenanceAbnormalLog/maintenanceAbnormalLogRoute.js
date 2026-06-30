import express from "express";
import { getAllAbnormalLogs, getAbnormalLogsBySchedule } from "./maintenanceAbnormalLogController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllAbnormalLogs);
router.get("/:scheduleId", getAbnormalLogsBySchedule);

export default router;
