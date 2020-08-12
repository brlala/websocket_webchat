class Namespace {
  constructor(id, nsTitle, image, endpoint) {
    this.id = id;
    this.nsTitle = nsTitle;
    this.image = image;
    this.endpoint = endpoint;
    this.rooms = [];
  }

  addRoom(roomObj) {
    this.rooms.push(roomObj);
  }
}

module.exports = Namespace;
