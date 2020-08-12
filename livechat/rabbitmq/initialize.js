const amqp = require('amqplib');

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

      // chatbot queue
      await this.channel.assertQueue(process.env.RABBITMQ_LIVECHAT_QUEUE, {
        durable: true,
      });

      // controller queue
      console.log(process.env.RABBITMQ_CONTROLLER_QUEUE);
      await this.channel.assertQueue(process.env.RABBITMQ_CONTROLLER_QUEUE, {
        durable: true,
      });

      // livechat requests exchange
      await this.channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'fanout', {
        durable: true,
      });
      await this.channel.bindQueue(process.env.RABBITMQ_QUEUE, process.env.RABBITMQ_EXCHANGE);
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
    const queue = `livechat_to_gateway_${fullMessage.username}`;

    await this.sendDataToQueue(queue, fullMessage);
    await this.sendDataToControllerQueue(queue);

    console.log(`[x] Sent ${JSON.stringify(fullMessage)} to ${queue}`);
  }
}
module.exports = new RabbitMq();
