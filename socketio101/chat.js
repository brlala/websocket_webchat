const express = require('express');
const app = express();
const socketio = require('socket.io');

app.use(express.static(__dirname + '/public'));

const expressServer = app.listen(9000);
const io = socketio(expressServer);
io.on('connection', (socket) => {
  socket.emit('messageFromServer', {data: 'Welcome to the SocketIO Server'});
  socket.on('messageToServer', (dataFromClient) => {
    console.log(dataFromClient);
  });
  socket.on('newMessageToServer', (msg) => {
    io.emit('messageToClients', {text: msg.text});
  });
});