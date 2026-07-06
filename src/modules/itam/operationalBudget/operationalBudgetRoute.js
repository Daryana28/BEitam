import express from "express";
import * as controller from "./operationalBudgetController.js";

const router = express.Router();

router.get("/", controller.getOperationalBudgets);
router.post("/", controller.createOperationalBudget);
router.post("/import", controller.importOperationalBudgets);
router.put("/:id", controller.updateOperationalBudget);
router.delete("/:id", controller.deleteOperationalBudget);
router.delete("/", controller.deleteAllOperationalBudgets);

export default router;
