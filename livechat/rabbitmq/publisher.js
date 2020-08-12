const rabbitMq = require('./initialize');

function sendToQueue(queue, data) {
  channel.assertQueue(queue, {
    durable: true,
    expire: 60 * 60 * 24,
  });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
}

function sendToControllerQueue(data) {
  const controllerQueue = 'livechat_to_gateway';
  // controller queue
  sendToQueue(channel, controllerQueue, data);
}

function publishMessage(fullMessage) {
  console.log('publishing');
  const queue = `livechat_to_gateway_${fullMessage.username}`;

  sendToQueue(channel, queue, fullMessage);
  sendToControllerQueue(channel, queue);

  console.log(`[x] Sent ${JSON.stringify(fullMessage)} to ${queue}`);
}

module.exports = publishMessage;
