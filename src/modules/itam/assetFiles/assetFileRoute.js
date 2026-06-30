// be\src\modules\itam\assetFiles\assetFileRoute.js
import {
 Router,
} from "express";

import multer from "multer";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import controller from "./assetFileController.js";

const router =
 Router();

const upload =
 multer({
  dest:
   "uploads/assets/",
 });

router.get(
 "/:id/files",
 authMiddleware,
 controller.getByAssetId
);

router.post(
 "/:id/files",
 authMiddleware,
 upload.single(
  "file"
 ),
 controller.upload
);

export default router;