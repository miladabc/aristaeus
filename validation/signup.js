const joi = require('joi');

module.exports = {
  body: {
    firstName: joi
      .string()
      .trim()
      .min(3)
      .max(30)
      .required(),
    lastName: joi
      .string()
      .trim()
      .min(3)
      .max(30)
      .required(),
    username: joi
      .string()
      .trim()
      .alphanum()
      .lowercase()
      .min(3)
      .max(30)
      .required(),
    email: joi
      .string()
      .trim()
      .email()
      .lowercase()
      .required(),
    password: joi
      .string()
      .min(5)
      .max(30)
      .required(),
    confirmPassword: joi
      .valid(joi.ref('password'))
      .required()
      .options({
        language: { any: { allowOnly: 'must match password' } }
      })
  }
};
