// be\src\middlewares\validateRequest.js
export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body, {
        abortEarly: false,
        allowUnknown: false,
      });

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:
          error?.details?.map((x) => ({
            field: x.path.join("."),
            message: x.message,
          })) || [],
      });
    }
  };
};

export default validateRequest;