const amqp = require('amqplib');
const handleMessage = require('../job');

const url = process.env.RABBITMQ_SERVER;

class RabbitMq {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connect();
  }

  async connect() {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.channel.prefetch(1);

      // chatbot queue
      await this.channel.assertQueue(process.env.RABBITMQ_LIVECHAT_QUEUE, {
        durable: true,
      });

      // controller queue
      await this.channel.assertQueue(process.env.RABBITMQ_CONTROLLER_QUEUE, {
        durable: true,
      });

      // livechat requests exchange
      await this.channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'direct', {
        durable: true,
      });

      const routing = 'requests';
      await this.channel.bindQueue(process.env.RABBITMQ_LIVECHAT_QUEUE, process.env.RABBITMQ_EXCHANGE, routing);
      let userQueueName = await this.consumeQueue(process.env.RABBITMQ_LIVECHAT_QUEUE);
      this.consumeUserQueue(userQueueName);
    } catch (err) {
      console.log(err);
      throw new Error('Connection failed');
    }
  }

  async sendDataToQueue(queue, data) {
    this.channel.assertQueue(queue, {
      durable: true,
      expire: 3600000,
    });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async sendDataToControllerQueue(data) {
    const controllerQueue = 'livechat_to_gateway';
    // controller queue
    await this.sendDataToQueue(controllerQueue, data);
  }

  async publishMessage(fullMessage) {
    console.log('publishing');
    const queue = `livechat_to_gateway_${process.env.ABBREVIATION}_${fullMessage.receiver_platform_id}`;

    await this.sendDataToQueue(queue, fullMessage);
    await this.sendDataToControllerQueue(queue);

    console.log(`[x] Sent ${JSON.stringify(fullMessage)} to ${queue}`);
  }

  consumeQueue(queueName) {
    return new Promise((resolve, reject) => {
      console.log('consuming');
      this.channel.consume(queueName, (userQueue) => {
        const userQueueName = userQueue.content.toString();
        console.log(`[x] Received ${userQueueName}`);
        resolve(userQueueName);
        // send message to livechat agent
      }, {
        // automatic acknowledgment mode,
        // see https://www.rabbitmq.com/confirms.html for details
        noAck: true,
      });
    });
  }

  consumeUserQueue(userQueueName) {
    return new Promise((resolve, reject) => {
      console.log(`Start consuming userqueue ${userQueueName}`);
      this.channel.consume(userQueueName, (msg) => {
        console.log(`[x] Received ${msg.content.toString()}`);
        handleMessage(JSON.parse(msg.content));
        // send message to livechat agent
      }, {
        // automatic acknowledgment mode,
        // see https://www.rabbitmq.com/confirms.html for details
        noAck: true,
      });
    });
  }
}
module.exports = {
  rabbitMq: new RabbitMq(),
  start(io) {
    io.on('connection', (socket) => {
      socket.on('message', (message) => {
        console.log('info', message.value);
        socket.emit('ditConsumer', message.value);
        console.log('from console', message.value);
      });
    });
  },
};
