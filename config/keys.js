const port = process.env.PORT || 8000;
const dbURI = process.env.DB_URI || 'mongodb://localhost/auth';
const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';

const secretOrKey = process.env.SECRET_OR_KEY;
const sendgridAPIKey = process.env.SENDGRID_API_KEY;

const googleClientID = process.env.GOOGLE_AUTH_ID;
const googleClientSecret = process.env.GOOGLE_AUTH_SECRET;

const cloudinaryKey = process.env.CLOUDINARY_KEY;
const cloudinarySecret = process.env.CLOUDINARY_SECRET;

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
  cloudinaryKey,
  cloudinarySecret
};
