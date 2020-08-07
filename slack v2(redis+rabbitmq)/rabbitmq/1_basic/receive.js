const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0;
  }
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }
    let queue = 'hello';

    channel.assertQueue(queue, {
      durable: false,
    });

    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

    channel.consume(queue, (msg) => {
      console.log(`[x] Received ${msg.content.toString()}`);
    }, {
      noAck: true,
    });
  });
});
