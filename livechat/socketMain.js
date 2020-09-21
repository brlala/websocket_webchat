// Database
const mongoose = require('mongoose');
const db = require('./database').initialize();
const { validateObjectId } = require('./database');

// // Main App
// const app = require('./app');
//
// const PORT = process.env.APP_PORT;
// const expressServer = app.listen(PORT, () => {
//   console.log(`Server is running on Port: ${PORT}`);
// });
// const io = require('./socketio').initialize(expressServer);

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
const { uploadFile } = require('./uploader');
const { getBotConfig } = require('./globals');

// variables to record user info
let users = [];

function socketMain(io, socket) {
  console.log("Someone called me! I'm socketMain!");
  // main namespace connection

  console.log(`Connected: ${socket.payload.email}`);
  // console.log(socket.handshake);
  // build an array to send back img and endpoint of each NS
  const nsData = namespaces.map((ns) => ({
    img: ns.image,
    endpoint: ns.endpoint,
  }));
  // console.log(nsData);
  // send ns data back to client, use socket NOT io because we just want to send it to this client
  socket.emit('nsList', nsData);
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.payload.email}`);
  });

  namespaces.forEach((namespace) => {
    // console.log('reloading namespace in ', namespace);
    io.of(namespace.endpoint).on('connection', (async (nsSocket) => {
      // const { username } = nsSocket.handshake.query;

      // console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
      // a socket has  connected to one of our chatgroup namespaces, send that ns group info back
      nsSocket.emit('nsRoomLoad', namespace.rooms);
      nsSocket.on('joinRoom', async (payload, numberOfUsersCallback) => {
        console.log(`[x] Received Event: joinRoom, Payload: ${JSON.stringify(payload)}`);
        // // deal with history... once we have it
        // console.log(nsSocket.rooms);
        const { roomToJoin, username, id } = payload;
        const roomToLeave = Object.keys(nsSocket.rooms)[1];
        nsSocket.leave(roomToLeave);
        updateUsersInRoom(namespace, roomToLeave);
        nsSocket.join(roomToJoin);
        // io.of('/wiki').in(roomToJoin).clients((error, clients) => {
        //   console.log(clients.length);
        //   numberOfUsersCallback(clients.length);
        // });
        console.log('Users: ', users);
        const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToJoin);
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
            [receiver]: roomToJoin,
            abbr: process.env.ABBREVIATION,
            platform: nsRoom.platform,
            created_at: Date.now(),
            created_by: username,
          };
          await rabbitMq.publishMessage(data);

          // loading the amount of messages
          const botConfig = await getBotConfig();
          console.log(botConfig.livechat.history_message_count);
          let messages = await Message.find()
            .sort({ _id: -1 })
            .limit(botConfig.livechat.history_message_count)
            .or([
              { session_id: roomToJoin },
              { sender_id: roomToJoin },
              { receiver_id: roomToJoin },
            ])
            .exec();
          // console.log('MESSAGES');
          messages.slice().reverse().forEach((msg) => {
            const fullMsg = {
              text: msg.data.text,
              time: msg.created_at,
              username: msg.handler ? roomToJoin : 'bot',
              handler: msg.handler ? 'user' : 'bot',
              avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
            };
            console.log(fullMsg);
            nsRoom.addMessage(fullMsg);
          });
        }

        nsSocket.emit('historyCatchUp', nsRoom.history);
        io.of('/wiki').emit('nsRoomLoad', namespace.rooms);
        updateUsersInRoom(namespace, roomToJoin);
      });
      nsSocket.on('removeRoom', async (payload) => {
        console.log(`[x] Received Event: removeRoom, Payload: ${JSON.stringify(payload)}`);
        console.log(nsSocket.query);
        console.log({ payload });
        // deal with history... once we have it
        const { username, roomToRemove, id } = payload;
        const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomToRemove);
        console.log(`Found room ${nsRoom}`);
        const { platform } = nsRoom;
        namespaces[0].removeRoom(roomToRemove);
        io.of('/wiki').emit('nsRoomLoad', namespace.rooms);
        console.log(4);

        // remove user from connected state
        for (let i = 0; i < users.length; i++) {
          if (users[i].userId === roomToRemove) {
            console.log(`Removing user ${roomToRemove}`);
            users.splice(i, 1);
            console.log(users);
            break;
          }
        }
        const receiver = nsRoom.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
        const data = {
          data: {
            subtype: 'disconnect',
            text: 'Thanks for using our livechat services! We hope you have a pleasant experience 😊',
          },
          type: 'livechat',
          [receiver]: roomToRemove,
          abbr: process.env.ABBREVIATION,
          platform,
          created_at: Date.now(),
          created_by: username,
        };

        // ending livesession
        const keyField = platform === 'widget' ? 'session_id' : 'bot_user_id';
        const filter = { livechat_agent_id: id, [keyField]: roomToRemove, is_active: true };
        const queryRes = await LivechatSession.findOneAndUpdate(filter, { end_datetime: Date.now() },
          {
            upsert: true,
            sort: { created: -1 },
          });
        console.log({ queryRes });

        // await endLiveSession(id, roomToRemove, nsRoom.platform);
        await rabbitMq.publishMessage(data);

        // change user chat state
        const res = await changeUserChatState(roomToRemove, platform, 'bot');
        console.log('finding', res);
      });
      nsSocket.on('newMessageToServer', async (msg) => {
        console.log(`[x] Received Event: newMessageToServer, Payload: ${JSON.stringify(msg)}`);
        const nsRoom = namespace.rooms.find((room) => room.roomTitle === msg.room);
        msg.platform = nsRoom.platform;
        sendMessageToClient(nsSocket, namespace, msg);
      });
    }));
    // console.log(namespace)
  });

  async function formatMessage(msg) {
    let formattedMessage = {
      time: Date.now(),
      username: msg.username,
      type: msg.type,
      handler: 'agent',
      avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
      data: {},
    };
    if (msg.type === 'text') {
      formattedMessage.data.text = msg.data.text;
    } else if (msg.type === 'image') {
      formattedMessage.data.url = await uploadFile(msg.data.b64, msg.data.mimetype, '', msg.data.filename);
    } else {
      console.log(`Type ${msg.type} not supported`);
    }
    return formattedMessage;
  }

  async function sendMessageToClient(nsSocket, namespace, msg) {
    const fullMsg = formatMessage(msg);
    console.log(fullMsg);
    const receiver = msg.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
    const data = {
      data: {
        text: msg.text,
      },
      type: 'message',
      platform: msg.platform,
      sender_platform_id: msg.username,
      [receiver]: msg.room,
      abbr: process.env.ABBREVIATION,
    };

    // Send this message to all sockets that re in the room of this socket
    // console.log(nsSocket.rooms);
    // User will always be 2nd because first is default room
    const roomTitle = Object.keys(nsSocket.rooms)[1];

    // finding the room object for the room
    console.log(namespace.rooms);
    const nsRoom = namespace.rooms.find((room) => room.roomTitle === roomTitle);
    nsRoom.addMessage(fullMsg);
    if (msg.platform) {
      // only publish to queue if room is from valid users
      await rabbitMq.publishMessage(data);
    }
    // console.log('matched room');
    // console.log(nsRoom);
    io.of(namespace.endpoint).to(roomTitle).emit('messageToClients', fullMsg);
    console.log(2);
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
    console.log(`searching for ${userId}`);
    return new Promise((resolve, reject) => {
      let queryRes;
      if (platform === 'widget') {
        queryRes = Session.findOneAndUpdate({ _id: userId }, { chat_state: state }, {
          returnOriginal: false,
          useFindAndModify: false,
        });
      } else {
        queryRes = BotUser.findOneAndUpdate({ [`${platform}.id`]: userId }, { chat_state: state }, {
          returnOriginal: false,
          useFindAndModify: false,
        });
      }
      resolve(queryRes);
      // let message = new SessionMessage(data);
      // message.save();
      // resolve('added');
    });
  }

  function changeLiveSessionState(agentId, userId, platform, livechatOngoing) {
    // await changeLiveSessionState(nsSocket.userId, roomToJoin, nsRoom.platform, true);
    console.log(`searching for ${userId}`);
    const keyField = platform === 'widget' ? 'session_id' : 'bot_user_id';
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
        lsSession[keyField] = userId;
        const queryRes = lsSession.save();
        resolve(`Session saved ${queryRes}`);
      });
    }
    return new Promise((resolve, reject) => {
      const filter = { livechat_agent_id: agentId, [keyField]: userId, is_active: true };
      console.log({ filter });
      // const queryRes = LivechatSession.findOneAndUpdate(filter, { end_datetime: Date.now(), is_active: false },
      //   {
      //     upsert: true,
      //     sort: { created: -1 },
      //   });
      const lsSession = LivechatSession.findOne(filter, {
        upsert: true,
        sort: { created: -1 },
      });
      lsSession.end_datetime = Date.now();
      lsSession.is_active = false;
      const queryRes = lsSession.save();
      console.log({ queryRes });
      resolve(`Session saved ${queryRes}`);
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
}

module.exports = socketMain;
