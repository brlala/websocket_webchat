function joinNs(endpoint) {
  if (nsSocket) {
    // check to see if nssocket is initialized
    nsSocket.close();

    // remove event listener before adding again
    document.querySelector('#user-input').removeEventListener('submit', formSubmission);
  }
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
        joinRoom(e.target.innerText);
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
    const newMsg = buildHtml(msg);
    document.querySelector('#messages').innerHTML += newMsg;
  });

  // listeners for form so when users send out a text message it will go out to server
  document.querySelector('.message-form').addEventListener('submit', formSubmission);
}

function formSubmission(event) {
  event.preventDefault();
  const newMessage = document.querySelector('#user-message').value;
  nsSocket.emit('newMessageToServer', { text: newMessage });
}

function buildHtml(msg) {
  const convertedDate = new Date(msg.time).toLocaleString();
  const newHtml = `<li>
                    <div class="user-image">
                        <img src=${msg.avatar} />
                    </div>
                    <div class="user-message">
                        <div class="user-name-time">${msg.username} <span>${convertedDate}</span></div>
                        <div class="message-text">${msg.text}</div>
                    </div>
                </li>`;
  return newHtml;
}
