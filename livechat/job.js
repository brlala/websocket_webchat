const { v4: uuidv4 } = require('uuid');
const Room = require('./classes/Room');

let { getIO } = require('./socketio');
const namespaces = require('./data/namespaces');

module.exports = function (msg) {
  let io = getIO();
  const fullMsg = {
    text: msg.data.text,
    time: Date.now(),
    username: msg.sender_platform_id,
    avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
  };
  namespaces[0].addRoom(new Room(uuidv4(), msg.sender_platform_id, 'Wiki'));
  io.of('/wiki').to('New Articles').emit('messageToClients', fullMsg);
};
