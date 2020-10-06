const amqp = require('amqplib');
const sleep = require('util').promisify(setTimeout);

const { getBotConfig } = require('../globals');
const { handleMessage, addRequestRoom } = require('../job');
const { getFormattedIpAddress } = require('../networking');

class RabbitMq {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connect();
  }

  async connect() {
    try {
      const botConfig = await getBotConfig();
      const url = `amqp://${botConfig.rabbitmq.rabbitmq_uri}`;
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.channel.prefetch(1);

      const RABBITMQ_LIVECHAT_QUEUE = `livechat_${getFormattedIpAddress()}_0`;
      // livechat queue
      await this.channel.assertQueue(RABBITMQ_LIVECHAT_QUEUE, {
        durable: true,
        expires: 60000,
      });
      const RABBITMQ_GATEWAY_CONTROLLER_QUEUE = botConfig.rabbitmq.rabbitmq_gateway_to_livechat;
      const RABBITMQ_CONTROLLER_QUEUE = botConfig.rabbitmq.rabbitmq_livechat_to_gateway;

      // gateway to livechat queue
      await this.channel.assertQueue(RABBITMQ_GATEWAY_CONTROLLER_QUEUE, {
        durable: true,
      });

      // controller queue
      await this.channel.assertQueue(RABBITMQ_CONTROLLER_QUEUE, {
        durable: true,
      });

      // livechat requests exchange
      await this.channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'direct', {
        durable: true,
      });
      const routing = 'requests';
      await this.channel.bindQueue(RABBITMQ_LIVECHAT_QUEUE, process.env.RABBITMQ_EXCHANGE, routing);

      // consume from worker queue, if it's a request, add a room, else, consume the queue
      await this.channel.consume(RABBITMQ_LIVECHAT_QUEUE, async (msg) => {
        const data = msg.content.toString();
        console.log(`Received '${data}' from '${RABBITMQ_LIVECHAT_QUEUE}'`);
        if (data.startsWith(RABBITMQ_GATEWAY_CONTROLLER_QUEUE)) {
          await this.consumeUserQueue(data);
        } else {
          const payload = JSON.parse(data);
          addRequestRoom(payload);
        }
      },
      {
        noAck: true,
      });

      // consume from task queue and queue it to worker queue
      await this.channel.consume(RABBITMQ_GATEWAY_CONTROLLER_QUEUE, async (msg) => {
        const userQueue = msg.content.toString();
        console.log(`consuming '${userQueue}'`);
        const userQueueName = `${RABBITMQ_GATEWAY_CONTROLLER_QUEUE}_${userQueue}`;
        console.log(`[x] Received '${userQueueName}', sending to ${RABBITMQ_LIVECHAT_QUEUE}`);
        await this.sendTaskToWorkerQueue(userQueueName, RABBITMQ_LIVECHAT_QUEUE);
      }, {
        // automatic acknowledgment mode,
        // see https://www.rabbitmq.com/confirms.html for details
        noAck: true,
      });
      console.log('RabbitMQ Connection successful');
    } catch (err) {
      console.log(err);
      console.log('RabbitMQ Connection failed, attempting reconnect in 5 seconds');
      await sleep(5000);
      await this.connect();
    }
  }

  async sendJsonDataToQueue(queue, data, options) {
    this.channel.assertQueue(queue, options);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async sendStringDataToQueue(queue, data, options) {
    console.info(`Sending string '${data}' to queue => ${queue}`);
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

  async sendTaskToWorkerQueue(taskName, workerQueueName) {
    // controller queue
    const options = {
      durable: true,
      expires: 60000,
    };
    await this.sendStringDataToQueue(workerQueueName, taskName, options);
  }

  async sendDataToControllerQueue(data) {
    const botConfig = await getBotConfig();
    const RABBITMQ_CONTROLLER_QUEUE = botConfig.rabbitmq.rabbitmq_livechat_to_gateway;
    const controllerQueue = RABBITMQ_CONTROLLER_QUEUE;
    // controller queue
    const options = {
      durable: true,
    };
    await this.sendStringDataToQueue(controllerQueue, data, options);
  }

  async publishMessage(fullMessage) {
    const botConfig = await getBotConfig();
    const RABBITMQ_CONTROLLER_QUEUE = botConfig.rabbitmq.rabbitmq_livechat_to_gateway;
    const receiver = fullMessage.platform === 'widget' ? 'session_id' : 'receiver_platform_id';
    const queue = `${RABBITMQ_CONTROLLER_QUEUE}_${process.env.ABBREVIATION}_${fullMessage[receiver]}`;
    await this.sendDataToUserQueue(queue, fullMessage);
    await this.sendDataToControllerQueue(queue);

    console.log(`[x] Sent '${JSON.stringify(fullMessage)}' to '${queue}'`);
  }

  consumeQueue(queueName) {
    return new Promise((resolve, reject) => {
      console.log(`consuming '${queueName}'`);
      this.channel.consume(queueName, (userQueue) => {
        const userQueueName = userQueue.content.toString();
        console.log(`[x] Received '${userQueueName}'`);
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
      console.log(`Start consuming userqueue '${userQueueName}'`);
      this.channel.consume(userQueueName, (msg) => {
        console.log(`[x] Received '${msg.content.toString()}'`);
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

const rabbitMq = new RabbitMq();

module.exports = {
  rabbitMq,
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
