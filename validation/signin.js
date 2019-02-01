const joi = require('joi');

module.exports = {
  body: {
    emailOrUsername: joi
      .string()
      .trim()
      .lowercase()
      .required(),
    password: joi.string().required()
  }
};
