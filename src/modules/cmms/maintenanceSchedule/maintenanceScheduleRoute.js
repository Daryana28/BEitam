import express from "express";
import { generateSchedule, getSchedules, createSchedule, updateSchedule, cancelSchedule, generateCheckboxes, getScheduleCheckboxes, getMonthlyScheduleMatrix } from "./maintenanceScheduleController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";


const router = express.Router();

router.use(authMiddleware);

router.post("/generate", generateSchedule);
router.post("/generate-checkboxes", generateCheckboxes);
router.post("/", createSchedule);
router.get("/monthly-view", getMonthlyScheduleMatrix);
router.get("/", getSchedules);
router.get("/:id/checkboxes", getScheduleCheckboxes);
router.put("/:id", updateSchedule);
router.patch("/:id/cancel", cancelSchedule);


export default router;
