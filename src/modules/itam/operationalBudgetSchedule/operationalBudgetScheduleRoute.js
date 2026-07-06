import express from "express";
import * as controller from "./operationalBudgetScheduleController.js";

const router = express.Router();

router.get("/", controller.getOperationalBudgetScheduleItems);
router.post("/", controller.createOperationalBudgetScheduleItem);
router.put("/:id", controller.updateOperationalBudgetScheduleItem);
router.delete("/:id", controller.deleteOperationalBudgetScheduleItem);

export default router;
