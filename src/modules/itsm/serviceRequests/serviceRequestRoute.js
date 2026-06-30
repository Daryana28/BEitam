// be\src\modules\itsm\serviceRequests\serviceRequestRoute.js
import { Router } from "express";
import serviceRequestController from "./serviceRequestController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, serviceRequestController.getAll);
router.get("/:id", authMiddleware, serviceRequestController.getById);
router.post("/", authMiddleware, serviceRequestController.create);
router.put("/:id", authMiddleware, serviceRequestController.update);
router.delete("/:id", authMiddleware, serviceRequestController.remove);

export default router;