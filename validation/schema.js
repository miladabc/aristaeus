const Joi = require('joi');

const SignupSchema = Joi.object().keys({
  firstName: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required(),
  lastName: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required(),
  username: Joi.string()
    .trim()
    .alphanum()
    .lowercase()
    .min(3)
    .max(30)
    .required(),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required(),
  password: Joi.string()
    .min(5)
    .max(30)
    .required(),
  confirmPassword: Joi.valid(Joi.ref('password'))
    .required()
    .options({
      language: { any: { allowOnly: 'must match password' } }
    })
});

const SigninSchema = Joi.object().keys({
  emailOrUsername: Joi.string()
    .trim()
    .lowercase()
    .required(),
  password: Joi.string().required()
});

const resetPassSchema = Joi.object().keys({
  password: Joi.string()
    .min(5)
    .max(30)
    .required(),
  confirmPassword: Joi.valid(Joi.ref('password'))
    .required()
    .options({
      language: { any: { allowOnly: 'must match password' } }
    })
});

const ProfileSchema = Joi.object()
  .keys({
    firstName: Joi.string()
      .trim()
      .min(3)
      .max(30)
      .optional(),
    lastName: Joi.string()
      .trim()
      .min(3)
      .max(30)
      .optional(),
    username: Joi.string()
      .trim()
      .alphanum()
      .lowercase()
      .min(3)
      .max(30)
      .optional(),
    email: Joi.string()
      .trim()
      .email()
      .lowercase()
      .optional(),
    currentPassword: Joi.string().optional(),
    newPassword: Joi.string()
      .min(5)
      .max(30)
      .optional(),
    confirmNewPassword: Joi.valid(Joi.ref('newPassword'))
      .optional()
      .options({
        language: { any: { allowOnly: 'must match password' } }
      })
  })
  .and(['currentPassword', 'newPassword', 'confirmNewPassword']);

module.exports = { SignupSchema, SigninSchema, resetPassSchema, ProfileSchema };
