// bringing in http because we don't have express
const http = require('http');
// bringing in socket io as 3rd party
const socketio = require('socket.io');

// We make http server with node
const server = http.createServer((req, res) => {
  res.end('You are connected');
});

const io = socketio(server);

io.on('connection', (socket) => {
  socket.emit('welcome', 'welcome to websocket_demo server');
  socket.on('message', function incoming(data) {
    console.log(data);
  });
});

server.listen(8000);