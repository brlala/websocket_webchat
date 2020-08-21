const { v4: uuidv4 } = require('uuid');
const Room = require('./classes/Room');

let { getIO } = require('./socketio');
const namespaces = require('./data/namespaces');

module.exports = function (msg) {
  let io = getIO();
  const fullMsg = {
    text: msg.data.text,
    time: Date.now(),
    username: msg.session_id,
    avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
  };
  const userRoom = new Room(uuidv4(), msg.session_id, 'Wiki');
  userRoom.addMessage(fullMsg);
  namespaces[0].addRoom(userRoom);

  io.of('/wiki').to(msg.session_id).emit('messageToClients', fullMsg);
};
