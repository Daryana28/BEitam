import express from "express";
import * as controller from "./assetBudgetScheduleController.js";

const router = express.Router();

router.get("/", controller.getAssetBudgetScheduleItems);
router.post("/", controller.createAssetBudgetScheduleItem);
router.put("/:id", controller.updateAssetBudgetScheduleItem);
router.delete("/:id", controller.deleteAssetBudgetScheduleItem);

export default router;
