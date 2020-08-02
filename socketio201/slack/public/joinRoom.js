function joinRoom(roomName) {
  // Send this room name to server so they can join
  nsSocket.emit('joinRoom', roomName);
}
