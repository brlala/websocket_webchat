const { rabbitMq } = require('./rabbitmq/initialize');

async function sendLineBreakMessage(nsRoom, message) {
  const receiver = nsRoom.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
  const data = {
    data: {
      subtype: 'connect',
      text: message,
    },
    type: 'livechat',
    [receiver]: nsRoom.userReference,
    abbr: process.env.ABBREVIATION,
    platform: nsRoom.platform,
    created_at: Date.now(),
    created_by: nsRoom.agent,
  };
  await rabbitMq.publishMessage(data);
}

module.exports = {
  sendLineBreakMessage,
};
