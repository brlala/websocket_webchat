
const socket = io('http://localhost:9000');
const socket2 = io('http://localhost:9000/admin');
console.log(socket.io);
socket.on('connect', () => {
  console.log(socket.id);
});

socket2.on('connect', () => {
  console.log(socket2.id);
});

socket.on('messageFromServer', (dataFromServer) => {
  console.log(dataFromServer);
  socket.emit('messageToServer', {
    data: 'Data from Client!',
  });
});

socket2.on('welcome', (dataFromServer) => {
  console.log(dataFromServer);
});
// socket.on('ping', () => {
//   console.log('ping was received from server');
// });
// socket.on('pong', (latency) => {
//   console.log(latency);
//   console.log('pong was sent to server');
// });

document.querySelector('#message-form').addEventListener('submit',(event)=>{
  event.preventDefault()
  const newMessage = document.querySelector('#user-message').value;
  socket.emit('newMessageToServer', {text: newMessage})
})

socket.on('messageToClients', (msg)=>{
  document.querySelector('#messages').innerHTML += `<li>${msg.text}</li>`
})
