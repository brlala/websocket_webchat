class Room {
  constructor(roomId, roomTitle, userReference, namespace, privateRoom = false, platform = null) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.namespace = namespace;
    this.privateRoom = privateRoom;
    this.history = [];
    this.platform = platform;
    this.agent = null;
    this.userReference = userReference;
  }

  addMessage(message) {
    this.history.push(message);
  }

  clearHistory() {
    this.history = [];
  }
}

module.exports = Room;
