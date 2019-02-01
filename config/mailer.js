const sgMail = require('@sendgrid/mail');

const keys = require('./keys');

sgMail.setApiKey(keys.sendgridAPIKey);

module.exports = sgMail;
