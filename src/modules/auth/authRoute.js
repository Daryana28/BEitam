// fe\src\modules\auth\authRoute.js
import { Router } from "express";
import {
  login,
  logout,
  refresh,
  me,
} from "./authController.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { loginSchema } from "./authValidation.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
router.get("/me", optionalAuthMiddleware, me);

export default router;