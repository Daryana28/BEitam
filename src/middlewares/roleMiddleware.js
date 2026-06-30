// be\src\middlewares\roleMiddleware.js
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = (req.user?.roles || []).map(r => String(r).toUpperCase());

    if (!roles.length) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (roles.includes("SUPERADMIN") || roles.includes("SUPERADMINISTRATOR")) {
      return next();
    }

    const allowed = allowedRoles.map(r => String(r).toUpperCase()).some((role) =>
      roles.includes(role)
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
};

export default roleMiddleware;