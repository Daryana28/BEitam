// be\src\middlewares\permissionMiddleware.js
import { Role, Permission } from "../models/index.js";

const permissionMiddleware = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const roles = req.user?.roles || [];

      if (!roles.length) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      if (roles.includes("SUPERADMIN")) {
        return next();
      }

      const roleData = await Role.findAll({
        where: {
          role_name: roles,
        },
        include: [
          {
            model: Permission,
            as: "permissions",
            attributes: ["permission_name"],
            through: { attributes: [] },
          },
        ],
      });

      const granted = new Set();

      roleData.forEach((role) => {
        role.permissions.forEach((p) => {
          granted.add(p.permission_name);
        });
      });

      const ok = requiredPermissions.every((x) =>
        granted.has(x)
      );

      if (!ok) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default permissionMiddleware;