const { v4: uuidv4 } = require('uuid');
const Room = require('./classes/Room');

let { getIO } = require('./socketio');
const namespaces = require('./data/namespaces');
const { getBotConfig } = require('./globals');
const Message = require('./models/Message');
const { insertDbMessageToRoom } = require('./utils');
const { formatMessage } = require('./utils');

async function handleMessage(msg) {
  console.log({ msg });
  const io = getIO();
  const receiver = msg.platform === 'widget' ? 'session_id' : 'sender_platform_id';
  msg.username = msg[receiver];
  const fullMsg = await formatMessage(msg, 'user');
  console.log({ rooms: namespaces[0].rooms, userReference: msg[receiver] });
  const userRoom = namespaces[0].rooms.find((room) => room.userReference === msg[receiver]);
  userRoom.addMessage(fullMsg);
  io.of('/wiki').to(userRoom.roomTitle).emit('messageToClients', fullMsg);
}

async function addRequestRoom(chatRequest) {
  const { uid, platform, id } = chatRequest;

  const roomReference = id || uid;
  console.log(`Adding room ${roomReference}:${platform}`);
  const userRoom = new Room(uuidv4(), roomReference, uid, 'Wiki', false, platform);
  namespaces[0].addRoom(userRoom);
  const io = getIO();

  // loading the amount of messages
  const botConfig = await getBotConfig();

  // cater for platforms and widget format
  let query;
  query = {
    $or: [
      { session_id: roomReference },
      { receiver_id: roomReference },
      { sender_id: roomReference },
    ],
  };

  let messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(botConfig.livechat.history_message_count)
    .exec();
  insertDbMessageToRoom(userRoom, roomReference, messages);
  console.log({ rooms: namespaces[0].rooms });
  namespaces.forEach((namespace) => {
    io.of('/wiki').emit('nsRoomLoad', namespace.rooms);
  });
}

module.exports = {
  addRequestRoom,
  handleMessage,
};
