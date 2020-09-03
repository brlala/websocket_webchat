function joinNs(endpoint) {
  if (nsSocket) {
    // check to see if nssocket is initialized
    nsSocket.close();

    // remove event listener before adding again
    document.querySelector('#user-input').removeEventListener('submit', formSubmission);
  }
  nsSocket = io(`http://localhost:9000${endpoint}`, {
    query: {
      token: 'aeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNTA3NzA2ZmY2YjljNjg5ODkwMDllNSIsImZpcnN0TmFtZSI6InRlc3QiLCJsYXN0TmFtZSI6InVzZXIiLCJlbWFpbCI6ImFzZEBhc2QuY29tIiwiaWF0IjoxNTk5MTIyNzcwLCJleHAiOjE2MDY4OTg3NzB9.RjJFk7tN05nw2CH7CWkcdBjG0CCLnjUsF-BF_WJvZOQ',
    },
  });
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
      roomList.innerHTML += `<li class="room"><span class="glyphicon glyphicon-${glyph}"></span>${room.roomTitle}</li><button class="roomDisconnect" value="${room.roomTitle}">Disconnect</button>`;
    });
    // add click listener to each room
    const roomNodes = document.getElementsByClassName('room');
    Array.from(roomNodes).forEach((elem) => {
      elem.addEventListener('click', (e) => {
        console.log('Someone clicked on', e.target.innerText);
        joinRoom(e.target.innerText);
      });
    });

    // add click listener to each room for disconnect
    const roomNodesDisconnect = document.getElementsByClassName('roomDisconnect');
    Array.from(roomNodesDisconnect).forEach((elem) => {
      elem.addEventListener('click', (e) => {
        console.log('Someone disconnected on', e.target.value);
        removeRoom(e.target.value);
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
  const roomName = document.querySelector('.curr-room-text').textContent;
  nsSocket.emit('newMessageToServer', { text: newMessage, room: roomName, username: socket.username });
}

function buildHtml(msg) {
  const convertedDate = new Date(msg.time).toLocaleString();
  const newHtml = `<li>
                    <div class="user-image">
                        <img src=${msg.avatar} alt="Avatar" class="avatar"/>
                    </div>
                    <div class="user-message">
                        <div class="user-name-time">${msg.username} <span>${convertedDate}</span></div>
                        <div class="message-text">${msg.text}</div>
                    </div>
                </li>`;
  return newHtml;
}
