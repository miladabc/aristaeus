const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');

const keys = require('../config/keys');
const Token = require('../models/token');
const Mailer = require('../services/Mailer');

const wrap = fn => (...args) => {
  const fnReturn = fn(...args);
  const next = args[args.length - 1];

  return Promise.resolve(fnReturn).catch(next);
};

const jwtForUser = user => {
  const payload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  };
  const token = jwt.sign(payload, keys.secretOrKey, keys.jwtExpires);

  return 'Bearer ' + token;
};

const createAndMailToken = async ({ user, subject, content, next }) => {
  const token = uuid();

  const newToken = new Token({
    userId: user._id,
    token
  });

  const savedToken = await newToken.save().catch(next);
  const mailer = new Mailer({
    from: 'no-reply@coolapp.com',
    subject,
    recipients: [user.email],
    content: content(savedToken.token)
  });

  mailer.send();
};

module.exports = { wrap, jwtForUser, createAndMailToken };
