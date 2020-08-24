const express = require('express');
require('dotenv').config();

// Database
const mongoose = require('mongoose');
const db = require('./database').initialize();
const { validateObjectId } = require('./database');

// Models
const SessionMessage = require('./models/Message');
const Session = require('./models/Session');

// Queue
const { rabbitMq } = require('./rabbitmq/initialize');

// Main
const app = express();

// Application Logic
const namespaces = require('./data/namespaces');
const User = require('./classes/User');
// console.log(namespaces)
app.use(express.static(`${__dirname}/public`));
const PORT = process.env.APP_PORT;
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT}`);
});
const io = require('./socketio').initialize(expressServer);

// variables to record user info
let users = [];

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

function reloadNamespace() {
  namespaces.forEach((namespace) => {
    io.of(namespace.endpoint).on('connection', ((nsSocket) => {
      // const { username } = nsSocket.handshake.query;

      // console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
      // a socket has  connected to one of our chatgroup namespaces, send that ns group info back
      nsSocket.emit('nsRoomLoad', namespace.rooms);
      nsSocket.on('joinRoom', async ({ roomToJoin, username }, numberOfUsersCallback) => {
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
        console.log('Users: ', users);
        if (!users.some((user) => user.userId === roomToJoin) && validateObjectId(roomToJoin)) {
          // only set the state and send first message if user does not exist in list
          console.log('setting join state for: ', roomToJoin);
          await changeUserChatState(roomToJoin, 'livechat');
          const user = new User(roomToJoin, 'no platform', 'connected');
          users.push(user);
          console.log(users);
          const data = {
            data: {
              subtype: 'connect',
              text: `You are currently connected with ${username}.`,
            },
            type: 'livechat',
            session_id: roomToJoin,
          };
          await rabbitMq.publishMessage(data);
        }

        const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToJoin);
        // console.log(nsRoom);
        nsSocket.emit('historyCatchUp', nsRoom.history);
        updateUsersInRoom(namespace, roomToJoin);
      });
      nsSocket.on('removeRoom', async (roomToRemove) => {
        // deal with history... once we have it
        const roomIndex = namespace.rooms.findIndex((room) => room.roomTitle === roomToRemove);
        console.log(roomIndex);
        namespaces[0].removeRoom(roomToRemove);

        // change user chat state
        const res = await changeUserChatState(roomToRemove, 'bot');
        console.log('finding', res);
      });
      nsSocket.on('newMessageToServer', async (msg) => {
        sendMessageToClient(nsSocket, namespace, msg);
      });
    }));
    // console.log(namespace)
  });
}
reloadNamespace();
module.exports.reloadNamespace = reloadNamespace;

async function sendMessageToClient(nsSocket, namespace, msg) {
  const fullMsg = {
    text: msg.text,
    time: Date.now(),
    username: msg.username,
    avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
  };
  console.log(fullMsg);
  const data = {
    data: {
      text: msg.text,
    },
    type: 'message',
    platform: 'widget',
    sender_platform_id: msg.username,
    session_id: msg.room,
    abbr: process.env.ABBREVIATION,
  };
  // try {
  //   const dbResponse = await addMessageToDb(data);
  //   console.log(dbResponse);
  // } catch (e) {
  //   console.log(e);
  // }
  if (validateObjectId(msg.room)) {
    // only publish to queue if room is from valid users
    await rabbitMq.publishMessage(data);
  }
  // Send this message to all sockets that re in the room of this socket
  // console.log(nsSocket.rooms);
  // User will always be 2nd because first is default room
  const roomTitle = Object.keys(nsSocket.rooms)[1];

  // finding the room object for the room
  console.log(namespace.rooms);
  const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomTitle);
  nsRoom.addMessage(fullMsg);
  // console.log('matched room');
  // console.log(nsRoom);
  io.of(namespace.endpoint).to(roomTitle).emit('messageToClients', fullMsg);
}

function updateUsersInRoom(namespace, roomToJoin) {
  // send number of users to everyone connected in the room
  io.of(namespace.endpoint).in(roomToJoin).clients((error, clients) => {
    // console.log(`There are ${clients.length}`);
    io.of(namespace.endpoint).in(roomToJoin).emit('updateMembers', clients.length);
  });
}

function addMessageToDb(data) {
  return new Promise((resolve, reject) => {
    let message = new SessionMessage(data);
    message.save();
    resolve('added');
  });
}

function changeUserChatState(userId, state) {
  console.log(`searching for ${userId}`);
  return new Promise((resolve, reject) => {
    const queryRes = Session.findOneAndUpdate({ _id: userId }, { chat_state: state }, {
      returnOriginal: false,
      useFindAndModify: false,
    });
    resolve(queryRes);
    // let message = new SessionMessage(data);
    // message.save();
    // resolve('added');
  });
}
