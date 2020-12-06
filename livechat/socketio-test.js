const socket = require('socket.io-client')('http://localhost:9000/wiki');

socket.on('connect', () => {
  console.log('connected');
  socket.emit('authentication', { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNTBkZjUwNWYyZWQyMTZmZmM0MGU0YiIsImZpcnN0TmFtZSI6IlVzZXIiLCJsYXN0TmFtZSI6IlBhbmQuYWkiLCJlbWFpbCI6ImxpaGVuZ0BwYW5kLmFpIiwicGVybWlzc2lvbnMiOlsiY3JlYXRlX2Nhbm5lZF9yZXNwb25zZSIsInJlYWRfY2FubmVkX3Jlc3BvbnNlIiwiY3JlYXRlX3VzZXIiLCJkZWxldGVfY2FubmVkX3Jlc3BvbnNlIiwiZWRpdF91c2VyX3RhZyIsImVkaXRfY2FubmVkX3Jlc3BvbnNlIiwicmVhZF91c2VyX3RhZyJdLCJwcm9maWxlUGljVXJsIjoiaHR0cHM6Ly9wYW5kYWktYWRtaW4tcG9ydGFsLnMzLWFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb20vdGVzMTExMXQuanBnIiwiaWF0IjoxNjA2MTI1Nzk3LCJleHAiOjE2MDYyMTIxOTd9.5LNSBqverhpA6ND02-Yvc90lyRy6_c0QOnZuLzpcSOw' });
  socket.on('authenticated', () => {
    // use the socket as usualZ
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
