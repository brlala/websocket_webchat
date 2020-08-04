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
  // console.log(socket.handshake);
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
    const { username } = nsSocket.handshake.query;
    // console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
    // a socket has  connected to one of our chatgroup namespaces, send that ns group info back
    nsSocket.emit('nsRoomLoad', namespace.rooms);
    nsSocket.on('joinRoom', (roomToJoin, numberOfUsersCallback) => {
      // deal with history... once we have it
      console.log(nsSocket.rooms);
      const roomToLeave = Object.keys(nsSocket.rooms)[1];
      nsSocket.leave(roomToLeave);
      updateUsersInRoom(namespace, roomToLeave);
      nsSocket.join(roomToJoin);
      // io.of('/wiki').in(roomToJoin).clients((error, clients) => {
      //   console.log(clients.length);
      //   numberOfUsersCallback(clients.length);
      // });
      const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToJoin);
      // console.log(nsRoom);
      nsSocket.emit('historyCatchUp', nsRoom.history);
      updateUsersInRoom(namespace, roomToJoin);
    });
    nsSocket.on('newMessageToServer', (msg) => {
      const fullMsg = {
        text: msg.text,
        time: Date.now(),
        username,
        avator: 'https://www.pinclipart.com/picdir/middle/165-1653686_female-user-icon-png-download-user-colorful-icon.png',
      };
      // console.log(fullMsg);
      // Send this message to all sockets that re in the room of this socket
      // console.log(nsSocket.rooms);
      // User will always be 2nd because first is default room
      const roomTitle = Object.keys(nsSocket.rooms)[1];

      // finding the room object for the room
      const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomTitle);
      nsRoom.addMessage(fullMsg);
      // console.log('matched room');
      // console.log(nsRoom);
      io.of(namespace.endpoint).to(roomTitle).emit('messageToClients', fullMsg);
    });
  }));
  // console.log(namespace)
});

function updateUsersInRoom(namespace, roomToJoin) {
  // send number of users to everyone connected in the room
  io.of(namespace.endpoint).in(roomToJoin).clients((error, clients) => {
    // console.log(`There are ${clients.length}`);
    io.of(namespace.endpoint).in(roomToJoin).emit('updateMembers', clients.length);
  });
}
