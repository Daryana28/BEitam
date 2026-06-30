// be\src\middlewares\authMiddleware.js
import jwt from "jsonwebtoken";

const optionalAuthMiddleware = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    req.user = null;
    next();
  }
};

export default optionalAuthMiddleware;