import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";

import authMiddleware from "../../../middlewares/authMiddleware.js";
import roleMiddleware from "../../../middlewares/roleMiddleware.js";
import controller from "./guideImageController.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/guides";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeKey = String(req.params.guideKey || "guide")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeKey}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar JPEG/JPG/PNG/WEBP yang diperbolehkan."));
    }
  },
});

router.get("/", authMiddleware, controller.list);

router.post(
  "/:guideKey",
  authMiddleware,
  roleMiddleware("SUPERADMIN", "ADMIN"),
  upload.single("file"),
  controller.upload
);

export default router;
