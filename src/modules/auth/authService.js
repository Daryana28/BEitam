// be/src/modules/auth/authService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "./authRepository.js";
import writeAudit from "../../core/utils/writeAudit.js";
import { hasUserColumn } from "../user/userColumnHelper.js";

const resolveMustChangePassword = async (user) => {
 const supportsColumn = await hasUserColumn("must_change_password");
 if (!supportsColumn) return 0;
 return user.must_change_password ? 1 : 0;
};

const login = async (
 email,
 password,
 req
) => {
 const user =
  await authRepository.findByEmail(
   email
  );

 if (!user) {
  await writeAudit({
   req,
   moduleName:
    "AUTH",
   entityName:
    "USER",
   entityId:
    null,
   actionName:
    "LOGIN_FAILED",
   description:
    `User not found: ${email}`,
  });

  const err =
   new Error(
    "Invalid credentials"
   );

  err.status = 401;

  throw err;
 }

 const valid =
  await bcrypt.compare(
   password,
   user.password_hash
  );

 if (!valid) {
  await writeAudit({
   req,
   moduleName:
    "AUTH",
   entityName:
    "USER",
   entityId:
    user.user_id,
   actionName:
    "LOGIN_FAILED",
   description:
    "Wrong password",
  });

  const err =
   new Error(
    "Invalid credentials"
   );

  err.status = 401;

  throw err;
 }

 const roles =
  user.roles?.map(
   (x) =>
    x.role_name
  ) || [];

 const mustChangePassword =
  await resolveMustChangePassword(
   user
  );

 const payload = {
  id: user.user_id,
  username:
   user.username,
  email:
   user.email,
  roles,
  must_change_password: mustChangePassword,
 };

 const token =
  jwt.sign(
   payload,
   process.env.JWT_SECRET,
   {
    expiresIn:
     process.env
      .JWT_EXPIRES ||
     "1d",
   }
  );

 const refreshToken =
  jwt.sign(
   { ...payload, type: "refresh" },
   process.env.JWT_SECRET,
   {
    expiresIn: "7d",
   }
  );

 await writeAudit({
  req,
  moduleName:
   "AUTH",
  entityName:
   "USER",
  entityId:
   user.user_id,
  actionName:
   "LOGIN",
  description:
   "Login success",
 });

  const profilePicture = user.profile_picture
   ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${req.protocol}://${req.get('host')}${user.profile_picture}`)
   : "";

  return {
   token,
   refreshToken,
   user: {
    id: user.user_id,
    username:
     user.username,
    full_name:
     user.full_name,
    email:
     user.email,
    roles,
    must_change_password: mustChangePassword,
    profile_picture: profilePicture,
   },
  };
};

const refresh = async (refreshToken) => {
 const decoded = jwt.verify(
  refreshToken,
  process.env.JWT_SECRET
 );

 if (decoded.type !== "refresh") {
  const err = new Error(
   "Invalid token type"
  );
  err.status = 401;
  throw err;
 }

 const user =
  await authRepository.findByEmail(
   decoded.email
  );

 if (!user) {
  const err = new Error(
   "User not found"
  );
  err.status = 401;
  throw err;
 }

 const roles =
  user.roles?.map(
   (x) =>
    x.role_name
  ) || [];

 const mustChangePassword =
  await resolveMustChangePassword(
   user
  );

 const payload = {
  id: user.user_id,
  username:
   user.username,
  email:
   user.email,
  roles,
  must_change_password: mustChangePassword,
 };

 const token =
  jwt.sign(
   payload,
   process.env.JWT_SECRET,
   {
    expiresIn:
     process.env
      .JWT_EXPIRES ||
     "1d",
   }
  );

 const newRefreshToken =
  jwt.sign(
   { ...payload, type: "refresh" },
   process.env.JWT_SECRET,
   {
    expiresIn: "7d",
   }
  );

 return {
  token,
  refreshToken: newRefreshToken,
  user: {
   id: user.user_id,
   username:
    user.username,
   full_name:
    user.full_name,
   email:
    user.email,
   roles,
   must_change_password: mustChangePassword,
  },
 };
};

export default {
 login,
 refresh,
};
