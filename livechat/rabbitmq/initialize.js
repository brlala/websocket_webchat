const amqp = require('amqplib');
const handleMessage = require('../job');
const { getFormattedIpAddress } = require('../networking');

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

      const RABBITMQ_LIVECHAT_QUEUE = `livechat_${getFormattedIpAddress()}_0`;
      // livechat queue
      await this.channel.assertQueue(RABBITMQ_LIVECHAT_QUEUE, {
        durable: true,
        expires: 60000,
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
      await this.channel.bindQueue(RABBITMQ_LIVECHAT_QUEUE, process.env.RABBITMQ_EXCHANGE, routing);
      let userQueueName = await this.consumeQueue(RABBITMQ_LIVECHAT_QUEUE);
      await this.consumeUserQueue(userQueueName);
    } catch (err) {
      console.log(err);
      throw new Error('Connection failed');
    }
  }

  async sendJsonDataToQueue(queue, data, options) {
    this.channel.assertQueue(queue, options);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async sendStringDataToQueue(queue, data, options) {
    this.channel.assertQueue(queue, options);
    this.channel.sendToQueue(queue, Buffer.from(data), {
      persistent: true,
    });
  }

  async sendDataToUserQueue(queue, data) {
    // controller queue
    const options = {
      durable: true,
      expires: 3600000,
    };
    await this.sendJsonDataToQueue(queue, data, options);
  }

  async sendDataToControllerQueue(data) {
    const controllerQueue = process.env.RABBITMQ_CONTROLLER_QUEUE;
    // controller queue
    const options = {
      durable: true,
    };
    await this.sendStringDataToQueue(controllerQueue, data, options);
  }

  async publishMessage(fullMessage) {
    console.log('publishing');
    const queue = `${process.env.RABBITMQ_CONTROLLER_QUEUE}_${process.env.ABBREVIATION}_${fullMessage.session_id}`;
    await this.sendDataToUserQueue(queue, fullMessage);
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
