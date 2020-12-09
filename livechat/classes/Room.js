class Room {
  constructor(roomId, roomTitle, userReference, namespace, privateRoom = false, platform = null, user) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.userReference = userReference;
    this.namespace = namespace;
    this.privateRoom = privateRoom;
    this.platform = platform;
    this.user = user;

    this.agent = null;
    this.history = [];
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
