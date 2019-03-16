const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');

const keys = require('../config/keys');
const Token = require('../models/token');
const Mailer = require('../services/Mailer');

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

const createAndMailToken = ({ user, subject, content, next }) => {
  const token = uuid();

  const newToken = new Token({
    userId: user._id,
    token
  });

  newToken
    .save()
    .then(token => {
      const mailer = new Mailer({
        from: 'no-reply@coolapp.com',
        subject,
        recipients: [user.email],
        content: content(token.token)
      });

      mailer.send();
    })
    .catch(next);
};

module.exports = { jwtForUser, createAndMailToken };
