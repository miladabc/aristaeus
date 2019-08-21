const keys = require('../config/keys');

const emailVerifyTemplate = token => {
  return `
    <html>
      <body>
        <div style="text-align: center;">
          <h3>Confirm your email</h3>
          <p>Please verify your account by clicking the link below:</p>
          <div>
            <a href="${keys.clientURL}/confirmemail?token=${token}">Confirm Email</a>
          </div>
        </div>
      </body>
    </html>
  `;
};

const forgotPassTemplate = token => {
  return `
    <html>
      <body>
        <div style="text-align: center;">
          <h3>Password reset instructions</h3>
          <p>Please follow the link below to reset your password:</p>
          <div>
            <a href="${keys.clientURL}/resetpass?token=${token}">Reset Password</a>
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = { emailVerifyTemplate, forgotPassTemplate };
