const Joi = require('joi');

module.exports = schema => {
  return (req, res, next) => {
    const { error } = Joi.validate(req.body, schema);

    if (!error) return next();

    return res
      .status(422)
      .json({ success: false, msg: error.details[0].message });
  };
};
