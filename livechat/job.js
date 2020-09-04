const { v4: uuidv4 } = require('uuid');
const Room = require('./classes/Room');

let { getIO } = require('./socketio');
const namespaces = require('./data/namespaces');

module.exports.handleMessage = function (msg) {
  const io = getIO();
  const receiver = msg.platform === 'widget' ? 'session_id' : 'sender_platform_id';

  const fullMsg = {
    text: msg.data.text,
    time: Date.now(),
    username: msg[receiver],
    handler: 'user',
    avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
  };
  const userRoom = namespaces[0].rooms.find((room) => room.roomTitle === msg[receiver]);
  userRoom.addMessage(fullMsg);

  io.of('/wiki').to(msg[receiver]).emit('messageToClients', fullMsg);
  console.log(1);
};

module.exports.addRequestRoom = function (chatRequest) {
  const { uid, platform } = chatRequest;
  console.log(`Adding room ${uid}:${platform}`);
  const userRoom = new Room(uuidv4(), uid, 'Wiki', false, platform);
  namespaces[0].addRoom(userRoom);
  const io = getIO();
  namespaces.forEach((namespace) => {
    io.of('/wiki').emit('nsRoomLoad', namespace.rooms);
  });
};
