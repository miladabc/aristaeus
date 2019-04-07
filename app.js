const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');

const authRouter = require('./routes/authRouter');
const userRouter = require('./routes/userRouter');

const app = express();

// Cross origin resource sharing
app.use(cors());

// Passport middleware
app.use(passport.initialize());
// Passport Config
require('./services/passport')();

app.use(morgan('dev'));
app.use(express.json({ type: '*/*' }));

app.use('/auth', authRouter);
app.use('/user', passport.authenticate('jwt', { session: false }), userRouter);

// error handler
app.use((err, req, res, next) => {
  console.log(err);

  res.status(err.status || 500).json(err);
});

module.exports = app;
