// be\src\modules\itsm\incidents\incidentRoute.js
import { Router } from "express";
import incidentController from "./incidentController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, incidentController.getAll);
router.get("/:id", authMiddleware, incidentController.getById);
router.post("/", authMiddleware, incidentController.create);
router.put("/:id", authMiddleware, incidentController.update);
router.delete("/:id", authMiddleware, incidentController.remove);

export default router;