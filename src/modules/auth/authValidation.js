// fe\src\modules\auth\authValidation.js
import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: false })
    .max(200)
    .required(),
  password: Joi.string().min(6).max(100).required(),
});