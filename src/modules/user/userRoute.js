import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";
import userController from "./userController.js";
import roleController from "./roleController.js";

const router = Router();

const ADMIN_ROLES = ["SUPERADMIN", "ADMIN"];

const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized. Silakan login." });
  }
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/profile";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya diperbolehkan mengunggah file gambar (JPEG/JPG/PNG/WEBP)."));
    }
  }
});

// Profile endpoints (defined BEFORE /:id to prevent shadow)
router.get("/profile", authMiddleware, requireAuth, userController.getUserProfile);
router.put("/profile", authMiddleware, requireAuth, userController.updateUserProfile);
router.put("/profile/password", authMiddleware, requireAuth, userController.changePassword);
router.put("/profile/picture", authMiddleware, requireAuth, upload.single("file"), userController.updateUserProfilePicture);

router.get(
    "/roles",
    authMiddleware,
    roleController.getAll
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.getAll
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.getById
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.create
);

router.post(
    "/:id/reset-password",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.resetPassword
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(...ADMIN_ROLES),
    userController.remove
);

export default router;