// be/src/modules/auth/authController.js
import authService from "./authService.js";
import writeAudit from "../../core/utils/writeAudit.js";

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
  return res.json({
   success: true,
   user:
    req.user,
  });
 };