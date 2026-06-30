// be\src\modules\itam\assets\assetCategoryRoute.js
import {
  Router,
} from "express";

import authMiddleware from "../../../middlewares/authMiddleware.js";
import assetCategoryController from "./assetCategoryController.js";

const router =
  Router();

router.get(
  "/",
  authMiddleware,
  assetCategoryController.getAll
);

router.post(
  "/",
  authMiddleware,
  assetCategoryController.create
);

router.put(
  "/:id",
  authMiddleware,
  assetCategoryController.update
);

router.delete(
  "/:id",
  authMiddleware,
  assetCategoryController.remove
);

export default router;