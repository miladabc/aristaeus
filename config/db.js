const mongoose = require('mongoose');

const keys = require('./keys');

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);

const connect = () => {
  mongoose.connect(keys.dbURI, { useNewUrlParser: true });
};

// Connect to mongo host, set retry on initial fail
const connectMongo = () => {
  connect();
  // CONNECTION EVENTS
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected');
  });

  mongoose.connection.on('error', err => {
    console.log(`Mongoose connection error: ${err}`);
    setTimeout(connect, 4000);
  });
};

module.exports = { connectMongo };
