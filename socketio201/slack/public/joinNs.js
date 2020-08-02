function joinNs(endpoint) {
  nsSocket = io(`http://localhost:9000${endpoint}`);
  nsSocket.on('nsRoomLoad', (nsRooms) => {
    // console.log(nsRooms);
    const roomList = document.querySelector('.room-list');
    roomList.innerHTML = '';
    nsRooms.forEach((room) => {
      let glyph;
      if (room.privateRoom) {
        glyph = 'lock';
      } else {
        glyph = 'globe';
      }
      roomList.innerHTML += `<li class="room"><span class="glyphicon glyphicon-${glyph}"></span>${room.roomTitle}</li>`;
    });
    // add click listener to each room
    const roomNodes = document.getElementsByClassName('room');
    Array.from(roomNodes).forEach((elem) => {
      elem.addEventListener('click', (e) => {
        console.log('Someone clicked on', e.target.innerText);
      });
    });
    // add room automatically, first time here
    const defaultRoom = document.querySelector('.room');
    const defaultRoomName = defaultRoom.innerText;
    joinRoom(defaultRoomName);
    // console.log(defaultRoomName);
  });

  nsSocket.on('messageToClients', (msg) => {
    console.log(msg);
    document.querySelector('#messages').innerHTML = `<li>${msg.text}</li>`;
  });

  // listeners for form so when users send out a text message it will go out to server
  document.querySelector('.message-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const newMessage = document.querySelector('#user-message').value;
    nsSocket.emit('newMessageToServer', { text: newMessage });
  });
}
