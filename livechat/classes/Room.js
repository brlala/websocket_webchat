class Room {
  constructor(roomId, roomTitle, userReference, namespace, privateRoom = false, platform = null, user) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.namespace = namespace;
    this.privateRoom = privateRoom;
    this.history = [];
    this.platform = platform;
    this.agent = null;
    this.userReference = userReference;
    this.user = user;
    this.userAvatar = user?.profile_pic_url || '';
    Room.increaseCount();
    this.userName = user?.first_name && user?.last_name ? `${user?.first_name} ${user?.last_name}` : `User ${Room.getCount()}`;
  }

  static increaseCount() {
    this.count += 1;
  }

  static getCount() {
    return this.count;
  }

  addMessage(message) {
    this.history.push(message);
  }

  clearHistory() {
    this.history = [];
  }
}

module.exports = Room;
