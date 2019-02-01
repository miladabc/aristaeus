const http = require('http');

const keys = require('./config/keys');
const app = require('./app');
const { connectMongo } = require('./config/db');

const server = http.createServer(app);

connectMongo();

server.listen(keys.port, () =>
  console.log(`Server listening on port ${keys.port}`)
);
