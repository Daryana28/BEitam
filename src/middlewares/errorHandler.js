// be\src\middlewares\errorHandler.js
const errorHandler = (err, req, res, next) => {
  const status =
    err.statusCode ||
    err.status ||
    (err.name === "SequelizeValidationError" ? 400 : 500);

  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.name === "SequelizeValidationError") {
    response.errors = err.errors.map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (process.env.NODE_ENV !== "production" && status === 500) {
    response.stack = err.stack;
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json(response);
};

export default errorHandler;