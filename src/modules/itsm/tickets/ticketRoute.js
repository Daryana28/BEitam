// be\src\modules\itsm\tickets\ticketRoute.js
import { Router } from "express";
import ticketController from "./ticketController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, ticketController.getAll);
router.get("/:id", authMiddleware, ticketController.getById);
router.post("/", authMiddleware, ticketController.create);
router.put("/:id", authMiddleware, ticketController.update);
router.delete("/:id", authMiddleware, ticketController.remove);

export default router;