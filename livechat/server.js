require('dotenv').config();
// utils
const jwt = require('jsonwebtoken');
const socketioAuth = require('socketio-auth');

// Database
const mongoose = require('mongoose');
const db = require('./database').initialize();
const { validateObjectId } = require('./database');

// Main App
const app = require('./app');

const PORT = process.env.APP_PORT;
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on Port: ${PORT}`);
});
const io = require('./socketio').initialize(expressServer);

// Models
const SessionMessage = require('./models/SessionMessage');
const Message = require('./models/Message');
const Session = require('./models/Session');
const BotUser = require('./models/BotUsers');
const LivechatSession = require('./models/LivechatSession');

// Queue
const { rabbitMq } = require('./rabbitmq/initialize');

// Application Logic
const namespaces = require('./data/namespaces');
const User = require('./classes/User');
const { formatMessage, formatOutgoingMessage, formatDbMessage } = require('./utils');

// variables to record user info
let users = [];

// setting up authentication middleware for socket-io
// Authenticate!
// function authenticate(socket, data, callback) {
//   // get credentials sent by the client
//   const { token } = data;
//   try {
//     const payload = jwt.verify(token, process.env.SECRET);
//     socket.userId = payload.id;
//     socket.client = payload;
//     callback(null, true);
//   } catch (error) {
//     console.log(`Invalid authentication: ${token}`);
//     // const errorArr = {
//     //   errors: [{
//     //     msg: 'The JWT provided is invalid',
//     //     code: 401,
//     //   }],
//     // };
//     // socket.emit('ws-error', errorArr);
//     callback(error);
//   }
// }
//
// function postAuthenticate(socket, data, callback) {
//   // get credentials sent by the client
//   const { token } = data;
//   const payload = jwt.verify(token, process.env.SECRET);
//   socket.userId = payload.id;
//   socket.client = payload;
//
//   console.log(`Connected: ${socket.client.email}`);
//
// }
//
// function disconnect(socket) {
//   console.log(`${socket.id} disconnected`);
// }
//
// socketioAuth(io, {
//   authenticate,
//   postAuthenticate,
//   disconnect,
//   timeout: 1000,
// });

// io.use(async (socket, next) => {
//   try {
//     const { token } = socket.handshake.query;
//
//     // verify token
//     const payload = jwt.verify(token, process.env.SECRET);
//     socket.userId = payload.id;
//     socket.payload = payload;
//     next();
//     // eslint-disable-next-line no-empty
//   } catch (err) {
//     // socket.emit('authentication-error', 'The token provided is invalid.');
//     console.log(`Invalid authentication: ${socket.handshake?.query?.token}`);
//   }
// });

// // main namespace connection
// io.on('connection', (socket) => {
//   console.log(`Connected: ${socket.id}`);
//   socket.auth = false;
//   socket.on('authentication', (data) => {
//     console.log('Authenticating...');
//     const { token } = data;
//     // check the auth data sent by the client
//     try {
//       const payload = jwt.verify(token, process.env.SECRET);
//       socket.userId = payload.id;
//       socket.payload = payload;
//       console.log(`Authenticated socket ${payload.email}`);
//       socket.auth = true;
//       // build an array to send back img and endpoint of each NS
//       const nsData = namespaces.map((ns) => ({
//         img: ns.image,
//         endpoint: ns.endpoint,
//       }));
//       // send ns data back to client, use socket NOT io because we just want to send it to this client
//       socket.emit('nsList', nsData);
//     } catch (e) {
//       const errArr = {
//         errors: [{
//           msg: 'The JWT provided is invalid',
//           code: 401,
//         }],
//       };
//       socket.emit('unauthorized', errArr);
//       console.log('Authentication failed...');
//       socket.disconnect(true);
//     }
//   });
//   setTimeout(() => {
//     // If the socket didn't authenticate, disconnect it
//     if (!socket.auth) {
//       const errArr = {
//         errors: [{
//           msg: 'No authorized event received',
//           code: 401,
//         }],
//       };
//       socket.emit('unauthorized', errArr);
//       console.log('Disconnecting socket due to timeout');
//       socket.disconnect(true);
//     }
//   }, 3000);
//   socket.on('disconnect', () => {
//     console.log(`Disconnected: ${socket.id}`);
//   });
// });

function resetChatState() {
  // Used when user are still connected and the server restarts
  Session.updateMany({ chat_state: { $ne: 'bot' } }, { chat_state: 'bot' }).then((value) => {
    console.log('Reset all Widget user chat state');
  }).catch((err) => {
    console.log('Error resetting user chat state');
  });

  BotUser.updateMany({ chat_state: { $ne: 'bot' } }, { chat_state: 'bot' }).then((value) => {
    console.log('Reset all Facebook user chat state');
  }).catch((err) => {
    console.log('Error resetting user chat state');
  });
}
resetChatState();
namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on('connection', (async (nsSocket) => {
    console.log(`Connected ${namespace.endpoint}: ${nsSocket.id}`);
    nsSocket.auth = false;
    nsSocket.on('authentication', (data) => {
      console.log('Authenticating...');
      const { token } = data;
      // check the auth data sent by the client
      try {
        const payload = jwt.verify(token, process.env.SECRET);
        nsSocket.userId = payload.id;
        nsSocket.payload = payload;
        console.log(`Authenticated socket ${payload.email}`);
        nsSocket.auth = true;
        // build an array to send back img and endpoint of each NS
        const nsData = namespaces.map((ns) => ({
          img: ns.image,
          endpoint: ns.endpoint,
        }));
        // send ns data back to client, use socket NOT io because we just want to send it to this client
        nsSocket.emit('nsList', nsData);
        // a socket has  connected to one of our chatgroup namespaces, send that ns group info back
        nsSocket.emit('nsRoomLoad', namespace.rooms);
      } catch (e) {
        const errArr = {
          errors: [{
            msg: 'The JWT provided is invalid',
            code: 401,
          }],
        };
        nsSocket.emit('unauthorized', errArr);
        console.log('Authentication failed...');
        nsSocket.disconnect(true);
      }
    });
    setTimeout(() => {
      // If the socket didn't authenticate, disconnect it
      if (!nsSocket.auth) {
        const errArr = {
          errors: [{
            msg: 'No authorized event received',
            code: 401,
          }],
        };
        nsSocket.emit('unauthorized', errArr);
        console.log('Disconnecting socket due to timeout');
        nsSocket.disconnect(true);
      }
    }, 3000);
    nsSocket.on('disconnect', () => {
      console.log(`Disconnected ${namespace.endpoint}: ${nsSocket.id}`);
    });

    // console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
    nsSocket.on('joinRoom', async (payload, numberOfUsersCallback) => {
      console.log(`[x] Received Event: joinRoom, Payload: ${JSON.stringify(payload)}`);
      // // deal with history... once we have it
      // console.log(nsSocket.rooms);
      const { roomToJoin, username, id } = payload;
      // const roomToLeave = Object.keys(nsSocket.rooms)[1];
      // nsSocket.leave(roomToLeave);
      // updateUsersInRoom(namespace, roomToLeave);

      // io.of('/wiki').in(roomToJoin).clients((error, clients) => {
      //   console.log(clients.length);
      //   numberOfUsersCallback(clients.length);
      // });
      console.log('Users: ', users);
      const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToJoin);
      if (!nsRoom || nsRoom.agent) {
        const error = [{ msg: 'An agent is already attending to the user.' }];
        nsSocket.emit('livechatError', { errors: error });
        console.log(`[x] Emit Event: livechatError - ${JSON.stringify(error)}`);
        return;
      }
      nsSocket.join(roomToJoin);

      if (!users.some((user) => user.userId === roomToJoin) && nsRoom.platform) {
        // only set the state and send first message if user does not exist in list
        console.log('setting join state for: ', roomToJoin);
        await changeUserChatState(roomToJoin, nsRoom.platform, 'livechat');
        await startLiveSession(id, roomToJoin, nsRoom.platform, true);
        const user = new User(roomToJoin, nsRoom.platform, 'connected');
        users.push(user);
        console.log('Adding User');
        console.log(users);
        const receiver = nsRoom.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
        nsRoom.agent = username;
        const data = {
          data: {
            subtype: 'connect',
            text: `You are currently connected with ${username}.`,
          },
          type: 'livechat',
          [receiver]: nsRoom.userReference,
          abbr: process.env.ABBREVIATION,
          platform: nsRoom.platform,
          created_at: Date.now(),
          created_by: username,
        };
        await rabbitMq.publishMessage(data);
      }
      console.log({ history: namespace.rooms });
      nsSocket.emit('historyCatchUp', nsRoom.history);
      io.of('/wiki').emit('nsRoomLoad', namespace.rooms);
      // updateUsersInRoom(namespace, roomToJoin);
    });
    nsSocket.on('removeRoom', async (payload) => {
      console.log(`[x] Received Event: removeRoom, Payload: ${JSON.stringify(payload)}`);
      // console.log(nsSocket.query);
      // deal with history... once we have it
      const { username, roomToRemove, id } = payload;
      nsSocket.leave(roomToRemove);
      users = users.filter((user) => user.userId !== roomToRemove);
      const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToRemove);
      if (!nsRoom || nsRoom.agent !== username) {
        const error = [{ msg: 'No permission to exit the room.' }];
        nsSocket.emit('livechatError', { errors: error });
        console.log(`[x] Emit Event: livechatError - ${JSON.stringify(error)}`);
        return;
      }
      console.log(`Found room ${nsRoom}`);
      const { platform } = nsRoom;
      namespaces[0].removeRoom(roomToRemove);
      io.of('/wiki').emit('nsRoomLoad', namespace.rooms);

      // // remove user from connected state
      // for (let i = 0; i < users.length; i++) {
      //   if (users[i].userId === roomToRemove) {
      //     console.log(`Removing user ${roomToRemove}`);
      //     users.splice(i, 1);
      //     break;
      //   }
      // }
      const receiver = nsRoom.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
      const data = {
        data: {
          subtype: 'disconnect',
          text: 'Thanks for using our livechat services! We hope you have a pleasant experience 😊',
        },
        type: 'livechat',
        [receiver]: nsRoom.userReference,
        abbr: process.env.ABBREVIATION,
        platform,
        created_at: Date.now(),
        created_by: username,
      };

      await endLiveSession(id, roomToRemove, nsRoom.platform);
      await rabbitMq.publishMessage(data);

      // change user chat state
      const res = await changeUserChatState(roomToRemove, platform, 'bot');
    });
    nsSocket.on('newMessageToServer', async (msg) => {
      console.log(`[x] Received Event: newMessageToServer, Payload: ${JSON.stringify(msg)}`);
      const nsRoom = namespace.rooms.find((room) => room.roomTitle === msg.roomTitle);
      if (!nsRoom || nsRoom.agent !== msg.username) {
        const error = [{ msg: 'No permission to send the message.' }];
        nsSocket.emit('livechatError', { errors: error });
        console.log(`[x] Emit Event: livechatError - ${JSON.stringify(error)}`);
        return;
      }
      msg.platform = nsRoom.platform;
      msg.userReference = nsRoom.userReference;
      sendMessageToClient(nsSocket, namespace, msg);
    });
    nsSocket.on('loadMessage', async (payload) => {
      console.log(`[x] Received Event: loadMessage, Payload: ${JSON.stringify(payload)}`);
      const { lastMessageId, limit, roomTitle } = payload;

      const query = {
        _id: {
          $lt: lastMessageId,
        },
        $or: [
          { session_id: roomTitle },
          { sender_id: roomTitle },
          { receiver_id: roomTitle },
        ],
      };

      let messages = await Message.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1) // +1 is to see if there are still more previous messages
        .exec();

      let results = { isLastMessage: false };
      if (messages.length <= limit) {
        results.isLastMessage = true;
      }

      // remove the +1 msg
      results.messages = await formatDbMessage(roomTitle, messages.slice(0, limit + 1));
      nsSocket.emit('showPreviousMessages', results);
    });
  }));
});

async function sendMessageToClient(nsSocket, namespace, msg) {
  let fullMsg = await formatMessage(msg, 'agent');
  console.log(fullMsg);

  // Send this message to all sockets that re in the room of this socket
  // console.log(nsSocket.rooms);
  // User will always be 2nd because first is default room
  // console.log({ nsSocket });
  // console.log({ rooms: nsSocket.rooms });
  // const roomTitle = Object.keys(nsSocket.rooms)[1];

  // finding the room object for the room
  const nsRoom = namespace.rooms.find((room) => room.roomTitle === msg.roomTitle);
  // console.log(`Error log: Searching ${roomTitle}`);
  // console.log({ nsRoom });
  nsRoom.addMessage(fullMsg);
  if (msg.platform) {
    // only publish to queue if room is from valid users
    await rabbitMq.publishMessage(formatOutgoingMessage(fullMsg));
  }
  // console.log('matched room');
  // console.log(nsRoom);
  io.of(namespace.endpoint).to(msg.roomTitle).emit('messageToClients', fullMsg);
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

function changeUserChatState(userId, platform, state) {
  console.log(`Changing User state for ${userId}`);
  return new Promise((resolve, reject) => {
    let queryRes;
    if (platform === 'widget') {
      queryRes = Session.findOneAndUpdate({ _id: userId }, { chat_state: state }, {
        returnOriginal: false,
        useFindAndModify: false,
      });
    } else {
      queryRes = BotUser.findOneAndUpdate({ _id: userId }, { chat_state: state }, {
        returnOriginal: false,
        useFindAndModify: false,
      });
    }
    resolve(queryRes);
  });
}

function changeLiveSessionState(agentId, userId, platform, livechatOngoing) {
  console.log(`searching for ${userId}`);
  if (livechatOngoing) {
    return new Promise((resolve, reject) => {
      const lsSession = new LivechatSession({
        livechat_agent_id: agentId,
        bot_user_id: null,
        session_id: null,
        start_datetime: Date.now(),
        end_datetime: null,
        is_active: true,
      });
      let keyField;
      // facebook platforms need to retrieve user_id document
      if (platform === 'widget') {
        keyField = 'session_id';
        lsSession[keyField] = userId;
        const queryRes = lsSession.save();
        resolve(`Session saved ${queryRes}`);
      } else {
        keyField = 'bot_user_id';
        BotUser.findOne({ _id: userId }, '_id', (err, doc) => {
          if (err) reject(err);
          console.log(doc);
          lsSession[keyField] = doc._id;
          const queryRes = lsSession.save();
          resolve(`Bot User session saved ${queryRes}`);
        });
      }
    });
  }
  return new Promise((resolve, reject) => {
    const keyField = platform === 'widget' ? 'session_id' : 'bot_user_id';
    const filter = { livechat_agent_id: agentId, [keyField]: userId, is_active: true };
    LivechatSession.findOneAndUpdate(filter, { end_datetime: Date.now() },
      {
        upsert: true,
        sort: { created: -1 },
      }, (err, doc) => {
        if (err) reject(err);
        resolve(`Session ${userId} ended.`);
      });
  });
}

function startLiveSession(agentId, userId, platform) {
  console.log(`Starting Live Session for ${userId}`);
  return changeLiveSessionState(agentId, userId, platform, true);
}

function endLiveSession(agentId, userId, platform) {
  console.log(`Ending Live Session for ${userId}`);
  return changeLiveSessionState(agentId, userId, platform, false);
}
