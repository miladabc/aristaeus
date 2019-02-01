const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');

const authRouter = require('./routes/authRouter');

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
app.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send('hi');
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log(err);

  res.status(err.status || 500).json(err);
});

module.exports = app;
