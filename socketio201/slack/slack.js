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
  // build an array to send back img and endpoint of each NS
  const nsData = namespaces.map((ns) => ({
    img: ns.image,
    endpoint: ns.endpoint,
  }));
  // console.log(nsData);
  // send ns data back to client, use socket NOT io because we just want to send it to this client
  socket.emit('nsList', nsData);
});

namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on('connection', ((nsSocket) => {
    console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
    // a socket has  connected to one of our chatgroup namespaces, send that ns group info back
    nsSocket.emit('nsRoomLoad', namespaces[0].rooms);
  }));
  // console.log(namespace)
});
