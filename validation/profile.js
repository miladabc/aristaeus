const joi = require('joi');

module.exports = {
  body: {
    firstName: joi
      .string()
      .trim()
      .min(3)
      .max(30)
      .optional(),
    lastName: joi
      .string()
      .trim()
      .min(3)
      .max(30)
      .optional(),
    username: joi
      .string()
      .trim()
      .alphanum()
      .lowercase()
      .min(3)
      .max(30)
      .optional(),
    email: joi
      .string()
      .trim()
      .email()
      .lowercase()
      .optional(),
    currentPassword: joi.string().optional(),
    newPassword: joi
      .string()
      .min(5)
      .max(30)
      .optional(),
    confirmNewPassword: joi
      .valid(joi.ref('newPassword'))
      .required()
      .options({
        language: { any: { allowOnly: 'must match password' } }
      })
  }
};
