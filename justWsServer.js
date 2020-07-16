const http = require('http');
// 3rd party library https://www.npmjs.com/package/ws
const websocket = require('ws');

const server = http.createServer((req, res) => {
  res.end('You are connected');
});

const wss = new websocket.Server({server})

// check on even upon handshake
wss.on('headers',(headers)=>{
  console.log(headers)
})

// if anybody connects to the websicket server, it will send
wss.on('connection', function connection(ws) {
  ws.send('welcome to websocket server');

  // adding a listener
  ws.on('message', function incoming(data) {
    console.log(data);
  });
});
server.listen(8000);