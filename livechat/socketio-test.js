const socket = require('socket.io-client')('http://localhost:9000');

socket.on('connect', () => {
  console.log('connected');
  socket.emit('authentication', { token: 'x' });
  socket.on('authenticated', () => {
    // use the socket as usual
    console.log('authenticated');
  });
});
socket.on('nsList', (data) => {
  console.log('nsList received');
});
socket.on('disconnect', (err) => {
  console.log(err);
});
socket.on('unauthorized', (err) => {
  console.log('There was an error with the authentication:', err.errors);
});
