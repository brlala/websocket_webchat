let { getIO } = require('./socketio');

module.exports = function () {
  let io = getIO();
  const fullMsg = {
    text: 'HIIIII!',
    time: Date.now(),
    username: 'USERNAME IS ME',
    avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
  };

  io.of('/wiki').to('New Articles').emit('messageToClients', fullMsg);
};
