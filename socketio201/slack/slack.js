const express = require('express');

const app = express();
const socketio = require('socket.io');

const namespaces = require('./data/namespaces');
// console.log(namespaces)
app.use(express.static(`${__dirname}/public`));
const expressServer = app.listen(9000);
const io = socketio(expressServer);

// main namespace connection
io.on('connection', (socket) => {
  socket.emit('messageFromServer', { data: 'Welcome to the SocketIO Server' });
  socket.on('messageToServer', (dataFromClient) => {
    console.log(dataFromClient);
  });
});

namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on('connection', ((socket) => {
    console.log(`${socket.id} has join ${namespace.endpoint}`);
  }));
  // console.log(namespace)
});
