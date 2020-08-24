function joinRoom(roomName) {
  // Send this room name to server so they can join
  nsSocket.emit('joinRoom', { roomToJoin: roomName, username: socket.username }, (newNumberOfMembers) => {
    // we want to update the room member total after joining
    document.querySelector('.curr-room-num-users').innerHTML = `${newNumberOfMembers} <span class="glyphicon glyphicon-user"></span>`;
  });
  nsSocket.on('historyCatchUp', (history) => {
    const messagesUl = document.querySelector('#messages');
    messagesUl.innerHTML = '';
    history.forEach((msg) => {
      const newMsg = buildHtml(msg);
      messagesUl.innerHTML += newMsg;
    });
    messagesUl.scrollTo(0, messagesUl.scrollHeight);
  });
  nsSocket.on('updateMembers', (numMembers) => {
    document.querySelector('.curr-room-num-users').innerHTML = `${numMembers} <span class="glyphicon glyphicon-user"></span>`;
    document.querySelector('.curr-room-text').innerHTML = `${roomName}`;
  });

  let searchBox = document.querySelector('#search-box');
  searchBox.addEventListener('input', (e) => {
    let messages = Array.from(document.getElementsByClassName('message-text'));
    messages.forEach((msg) => {
      if (msg.innerText.toLowerCase().indexOf(e.target.value.toLowerCase()) === -1) {
        // msg does not contain search term
        msg.style.display = 'none';
      } else {
        msg.style.display = 'block';
      }
    });
  });
}

function removeRoom(roomName) {
  // Send this room name to server so they can join
  nsSocket.emit('removeRoom', roomName);
}
