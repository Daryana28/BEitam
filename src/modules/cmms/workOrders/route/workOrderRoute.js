// be\src\modules\cmms\workOrders\route\workOrderRoute.js
import { Router } from "express";
import workOrderController from "../controller/workOrderController.js";
import authMiddleware from "../../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, workOrderController.getAll);
router.get("/:id", authMiddleware, workOrderController.getById);
router.post("/", authMiddleware, workOrderController.create);
router.put("/:id", authMiddleware, workOrderController.update);
router.delete("/:id", authMiddleware, workOrderController.remove);
router.get(
 "/asset/:assetId/predictive",
 authMiddleware,
 workOrderController.getPredictiveHealth
);
router.get(
 "/asset/:assetId/health",
 authMiddleware,
 workOrderController.getAssetHealth
);
router.get(
 "/asset/:assetId/auto-maintenance",
 authMiddleware,
 workOrderController.autoMaintenanceCheck
);
router.get(
 "/dashboard/summary",
 authMiddleware,
 workOrderController.dashboard
);
router.get(
 "/asset/:assetId/ai-predictive",
 authMiddleware,
 workOrderController.aiPredictive
);

export default router;