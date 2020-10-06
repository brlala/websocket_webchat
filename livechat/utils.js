const { uploadFile } = require('./uploader');

async function formatMessage(msg, handler) {
  const receiver = msg.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
  let formattedMessage = {
    time: Date.now(),
    username: msg.username,
    sender_platform_id: msg.username,
    type: msg.type,
    handler,
    [receiver]: msg.userReference,
    // avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
    platform: msg.platform,
    data: {},
    abbr: process.env.ABBREVIATION,
  };
  if (msg.type === 'message') {
    formattedMessage.data.text = msg.data.text;
  } else if (['images', 'files'].includes(msg.type)) {
    if (msg.data.urls) {
      // message incoming from gateway
      formattedMessage.data.urls = msg.data.urls;
      formattedMessage.data.items = msg.data.items;
    } else {
      const [fileType, fileExtension] = msg.data.mimetype.split('/');
      formattedMessage.data.items = [{ file_extension: fileExtension, file_name: msg.data.filename }];
      const url = await uploadFile(msg.data.b64, msg.data.mimetype, '', msg.data.filename);
      formattedMessage.data.urls = [{ url }];
    }
  } else {
    console.log(`Type ${msg.type} not supported`);
  }
  return formattedMessage;
}

function formatOutgoingMessage(msg) {
  // this is the CMF format for gateway, all messages will go through formatMessage -> formatOutgoingMessage
  let formattedMessage = JSON.parse(JSON.stringify(msg));
  if (msg.type === 'images') {
    formattedMessage.type = 'image';
    formattedMessage.data = {
      url: msg.data.urls[0].url,
    };
  } else if (msg.type === 'files') {
    formattedMessage.type = 'image';
    formattedMessage.data = {
      url: msg.data.urls[0].url,
    };
  }
  return formattedMessage;
}

function formatDbMessage(roomToJoin, messages) {
  // this is used when loading a room, to put DB messages into livechat message format
  console.log();
  let results = [];
  messages.slice().reverse().forEach((msg) => {
    let fullMsg = {
      id: msg._id,
      time: msg.created_at,
      roomTitle: roomToJoin,
      username: msg.handler ? roomToJoin : 'bot',
      handler: msg.handler ? 'user' : 'bot',
      // avatar: 'https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/256x256/user.png',
    };
    if (['image', 'images'].includes(msg.type)) {
      if (msg.type === 'image') {
        fullMsg.data = { url: msg.data.url };
      } else { // images facebook type
        fullMsg.data = { url: msg.data.urls[0].url };
      }
      fullMsg.type = 'image';
    } else { // default text type
      fullMsg.data = { text: msg.data.text };
      fullMsg.type = msg.type;
    }
    results.push(fullMsg);
  });
  return results;
}

function insertDbMessageToRoom(nsRoom, roomToJoin, messages) {
  console.log('Insert db messages');
  const formattedMessages = formatDbMessage(roomToJoin, messages);
  formattedMessages.forEach((message) => {
    nsRoom.addMessage(message);
  });
}

module.exports = {
  formatMessage,
  formatOutgoingMessage,
  formatDbMessage,
  insertDbMessageToRoom,
};
