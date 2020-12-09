const socket = require('socket.io-client')('http://localhost:9000/wiki');
const socket1 = require('socket.io-client')('http://localhost:9000/wiki');
// Get login token
// eslint-disable-next-line import/no-extraneous-dependencies
const axios = require('axios');

function loginUser(email, password) {
  return axios.post('http://localhost:9000/abbr/user/login', {
    email,
    password,
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
socket.on('connect', async () => {
  console.log('connected');
  const response = await loginUser('liheng@pand.ai', 'password1');
  socket.emit('authentication', { token: response.data.token });
  socket.on('nsList', (data) => {
    // console.log('nsList received');
  });
  socket.on('agentsOnline', (data) => {
    console.log(data);
  });
  socket.on('message', (data) => {
    console.log(`liheng@pand.ai received message ${JSON.stringify(data)}`);
  });
  socket.on('transferRequest', (data) => {
    console.log(`liheng@pand.ai received transferRequest ${JSON.stringify(data)}`);
  });
  socket.on('transferStatus', (data) => {
    console.log(`liheng@pand.ai received transferStatus ${JSON.stringify(data)}`);
  });
  socket.on('authenticated', () => {
    // use the socket as usualZ
    console.log('authenticated');
  });
  // nsSocket.on('joinRoom', async (payload, numberOfUsersCallback) => {
  //   console.log(`[x] Received Event: joinRoom, Payload: ${JSON.stringify(payload)}`);
  //   // // deal with history... once we have it
  //   // console.log(nsSocket.rooms);New Articles
  //   const {
  //     roomToJoin,
  //     username,
  //     id
  //   } = payload;
  // })
  console.log('Joining New Articles');
  await sleep(3000)
  socket.emit('joinTest');
  await sleep(3000)
  console.log('liheng@pand.ai send requestTransferChat');
  await sleep(3000)
  socket.emit('requestTransferChat', { agentToTransfer: 'asd1@asd.com', roomId: 'New Articles', problem: 'phone not working' });
});

socket.on('disconnect', (err) => {
  console.log(err);
});
socket.on('unauthorized', (err) => {
  console.log('There was an error with the authentication:', err.errors);
});

socket1.on('connect', async () => {
  // console.log('connected');
  const response = await loginUser('asd1@asd.com', 'password1');
  socket1.emit('authentication', { token: response.data.token });
  // socket1.emit('getAgentsOnlineList');

  socket1.on('transferRequest', async (data) => {
    console.log(`asd1@asd.com Received transferRequest: ${JSON.stringify(data)}`);
    await sleep(3000)
    console.log('asd1@asd.com accept transferRequest')
    socket1.emit('transferChat', { transfer: true, roomId: 'New Articles' });
  });

  socket1.on('transferRequest', (data) => {
    console.log(`asd1@asd.com received transferRequest ${JSON.stringify(data)}`);
  });

  socket1.on('transferStatus', (data) => {
    console.log(`asd1@asd.com received transferStatus ${JSON.stringify(data)}`);
  });
  socket1.on('message', (data) => {
    console.log(`asd1@asd.com received message ${JSON.stringify(data)}`);
  });
});
