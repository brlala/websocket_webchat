let socketio = require('socket.io');

let io = null;

function getIO() {
  return io;
}

function initialize(server) {
  io = socketio(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ['GET', 'POST'],
    },
  });
  return io;
}

module.exports = {
  getIO,
  initialize,
};
