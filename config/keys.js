const port = process.env.PORT || 8000;
const dbURI = process.env.DB_URI || 'mongodb://localhost/auth';
const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';

const secretOrKey = process.env.SECRET_OR_KEY;
const sendgridAPIKey = process.env.SENDGRID_API_KEY;

const googleClientID = process.env.GOOGLE_AUTH_ID;
const googleClientSecret = process.env.GOOGLE_AUTH_SECRET;

const githubClientID = process.env.GITHUB_AUTH_ID;
const githubClientSecret = process.env.GITHUB_AUTH_SECRET;

const linkedinClientID = process.env.LINKEDIN_AUTH_ID;
const linkedinClientSecret = process.env.LINKEDIN_AUTH_SECRET;

module.exports = {
  port,
  dbURI,
  clientURL,
  secretOrKey,
  sendgridAPIKey,
  saltFactor: 12,
  jwtExpires: { expiresIn: 3600 },
  googleAuth: {
    clientID: googleClientID,
    clientSecret: googleClientSecret
  },
  githubAuth: {
    clientID: githubClientID,
    clientSecret: githubClientSecret,
    scope: ['user:email'] // Fetch private emails
  },
  linkedinAuth: {
    clientID: linkedinClientID,
    clientSecret: linkedinClientSecret,
    scope: ['r_emailaddress', 'r_basicprofile']
  }
};
