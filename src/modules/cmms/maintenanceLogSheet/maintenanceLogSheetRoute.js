import express from "express";
import {
  getLogSheets,
  createLogSheet,
  updateLogSheet,
  deleteLogSheet,
} from "./maintenanceLogSheetController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Minimal roles required: STAFF, MAITENANCE_STAFF, ADMIN, etc.
// For now, let's allow all authenticated users to read, but you can restrict it further.
router.get("/", getLogSheets);
router.post("/", createLogSheet);
router.put("/:id", updateLogSheet);
router.delete("/:id", deleteLogSheet);

export default router;
