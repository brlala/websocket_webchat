const http = require('http');
const socketio = require('sock');

const server = http.createServer((req, res) => {
  res.end('You are connected');
});

const wss = new websocket.Server({server})

// check on even upon handshake
wss.on('headers',(headers)=>{
  console.log(headers)
})