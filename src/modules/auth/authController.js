// be/src/modules/auth/authController.js
import authService from "./authService.js";
import writeAudit from "../../core/utils/writeAudit.js";
import { User, Role, Department } from "../../models/index.js";
import { getExistingUserColumns } from "../user/userColumnHelper.js";

export const login = async (
 req,
 res,
 next
) => {
 try {
  const {
   email,
   password,
  } = req.body;

  const result =
   await authService.login(
    email,
    password,
    req
   );

  res.cookie(
   "access_token",
   result.token,
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge:
     24 *
     60 *
     60 *
     1000,
   }
  );

  res.cookie(
   "refresh_token",
   result.refreshToken,
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge:
     7 *
     24 *
     60 *
     60 *
     1000,
   }
  );

  return res.json({
   success: true,
   user:
    result.user,
   token:
    result.token,
  });
 } catch (err) {
  next(err);
 }
};

export const logout = async (
 req,
 res,
 next
) => {
 try {
  await writeAudit({
   req,
   moduleName:
    "AUTH",
   entityName:
    "USER",
   entityId:
    req.user?.id ||
    null,
   actionName:
    "LOGOUT",
   description:
    "Logout success",
  });

  res.clearCookie(
   "access_token",
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
   }
  );

  res.clearCookie(
   "refresh_token",
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
   }
  );

  return res.json({
   success: true,
   message:
    "Logout success",
  });
 } catch (err) {
  next(err);
 }
};

export const refresh = async (
 req,
 res,
 next
) => {
 try {
  const refreshToken =
   req.cookies?.refresh_token;

  if (!refreshToken) {
   const err = new Error(
    "No refresh token provided"
   );
   err.status = 401;
   throw err;
  }

  const result =
   await authService.refresh(
    refreshToken
   );

  res.cookie(
   "access_token",
   result.token,
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge:
     24 *
     60 *
     60 *
     1000,
   }
  );

  res.cookie(
   "refresh_token",
   result.refreshToken,
   {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge:
     7 *
     24 *
     60 *
     60 *
     1000,
   }
  );

  return res.json({
   success: true,
   user:
    result.user,
   token:
    result.token,
  });
 } catch (err) {
  next(err);
 }
};

export const me =
 async (
  req,
  res
 ) => {
  try {
    if (!req.user?.id) {
      return res.json({
        success: true,
        user: req.user,
      });
    }

    const userAttributes = await getExistingUserColumns([
      "user_id", "username", "full_name", "email", "profile_picture", "department_id"
    ]);

    const user = await User.findByPk(req.user.id, {
      attributes: userAttributes,
      include: [
        { model: Role, as: "roles", attributes: ["role_name"] },
        { model: Department, attributes: ["department_name"] },
      ],
    });

    if (!user) {
      return res.json({
        success: true,
        user: req.user,
      });
    }

    const roles = user.roles?.map((r) => r.role_name) || [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const profilePicture = user.profile_picture
      ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${baseUrl}${user.profile_picture}`)
      : "";

    return res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        roles,
        profile_picture: profilePicture,
        department: user.Department?.department_name || "",
      },
    });
  } catch (error) {
    console.error("Error in /auth/me:", error);
    return res.json({
      success: true,
      user: req.user,
    });
  }
 };