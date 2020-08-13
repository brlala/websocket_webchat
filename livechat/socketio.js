let socketio = require('socket.io');

let io = null;

module.exports.getIO = function () {
  return io;
};

exports.initialize = function (server) {
  io = socketio(server);
  return io;
};
