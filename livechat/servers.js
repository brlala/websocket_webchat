// See https://github.com/elad/node-cluster-socket.io
require('dotenv').config();
const express = require('express');
const cluster = require('cluster');
const net = require('net');
const socketio = require('socket.io');
// const helmet = require('helmet')
const socketMain = require('./socketMain');
// const expressMain = require('./expressMain');

const port = process.env.APP_PORT;
const numProcesses = require('os').cpus().length;
// Brew breaks for me more than it solves a problem, so I
// installed redis from https://redis.io/topics/quickstart
// have to actually run redis via: $ redis-server (go to location of the binary)
// check to see if it's running -- redis-cli monitor
const redisAdapter = require('socket.io-redis');
const farmhash = require('farmhash');

// Main App
const app = require('./app');

if (cluster.isMaster) {
  // This stores our workers. We need to keep them to be able to reference
  // them based on source IP address. It's also useful for auto-restart,
  // for example.
  let workers = [];

  // Helper function for spawning worker at index 'i'.
  let spawn = function (i) {
    workers[i] = cluster.fork();

    // Optional: Restart worker on exit
    workers[i].on('exit', (code, signal) => {
      // console.log('respawning worker', i);
      spawn(i);
    });
  };

  // Spawn workers.
  for (let i = 0; i < numProcesses; i++) {
    spawn(i);
  }

  // Helper function for getting a worker index based on IP address.
  // This is a hot path so it should be really fast. The way it works
  // is by converting the IP address to a number by removing non numeric
  // characters, then compressing it to the number of slots we have.
  //
  // Compared against "real" hashing (from the sticky-session code) and
  // "real" IP number conversion, this function is on par in terms of
  // worker index distribution only much faster.
  const workerIndex = function (ip, len) {
    return farmhash.fingerprint32(ip) % len; // Farmhash is the fastest and works with IPv6, too
  };

  // in this case, we are going to start up a tcp connection via the net
  // module INSTEAD OF the http module. Express will use http, but we need
  // an independent tcp port open for cluster to work. This is the port that
  // will face the internet
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    // We received a connection and need to pass it to the appropriate
    // worker. Get the worker for this connection's source IP and pass
    // it the connection.
    let worker = workers[workerIndex(connection.remoteAddress, numProcesses)];
    worker.send('sticky-session:connection', connection);
  });
  server.listen(port);
  console.log(`Master listening on port ${port}`);
} else {
  // Note we don't use a port here because the master listens on it for us.
  // let app = express();
  // app.use(express.static(__dirname + '/public'));
  // app.use(helmet());

  // Don't expose our internal server to the outside world.
  const expressServer = app.listen(0, 'localhost');
  // console.log("Worker listening...");
  // eslint-disable-next-line global-require
  const io = require('./socketio').initialize(expressServer);

  // Tell Socket.IO to use the redis adapter. By default, the redis
  // server is assumed to be on localhost:6379. You don't have to
  // specify them explicitly unless you want to change them.
  // redis-cli monitor
  io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

  // Here you might use Socket.IO middleware for authorization etc.
  // on connection, send the socket over to our module with socket stuff

  // setting up authentication middleware for socket-io
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.query;

      // verify token
      const payload = jwt.verify(token, process.env.SECRET);
      socket.userId = payload.id;
      socket.payload = payload;
      console.log('hey');
      next();
      // eslint-disable-next-line no-empty
    } catch (err) {
      // socket.emit('authentication-error', 'The token provided is invalid.');
      console.log(`Invalid authentication: ${socket.handshake?.query?.token}`);
    }
  });

  io.on('connection', (socket) => {
    socketMain(io, socket);
    // console.log(`connected to worker: ${cluster.worker.id}`);
  });

  // Listen to messages sent from the master. Ignore everything else.
  process.on('message', (message, connection) => {
    if (message !== 'sticky-session:connection') {
      return;
    }

    // Emulate a connection event on the server by emitting the
    // event with the connection the master sent us.
    expressServer.emit('connection', connection);

    connection.resume();
  });
}
