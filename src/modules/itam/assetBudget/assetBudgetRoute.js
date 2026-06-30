import express from "express";
import * as controller from "./assetBudgetController.js";

const router = express.Router();

router.get("/", controller.getAssetBudgets);
router.post("/import", controller.importAssetBudgets);
router.delete("/", controller.deleteAllAssetBudgets);

export default router;
