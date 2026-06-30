// be\src\modules\itam\assetLifecycle\assetLifecycleRoute.js
import express from "express";
import controller from "./assetLifecycleController.js";

const router =
  express.Router();

router.get(
  "/assets/:id/lifecycle",
  controller.getByAssetId
);

router.post(
  "/assets/:id/lifecycle",
  controller.create
);

export default router;