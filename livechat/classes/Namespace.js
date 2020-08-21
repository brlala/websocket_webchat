class Namespace {
  constructor(id, nsTitle, image, endpoint) {
    this.id = id;
    this.nsTitle = nsTitle;
    this.image = image;
    this.endpoint = endpoint;
    this.rooms = [];
  }

  addRoom(roomObj) {
    let roomExist = false;
    this.rooms.forEach((room) => {
      if (room.roomTitle === roomObj.roomTitle) {
        roomExist = true;
      }
    });
    if (!roomExist) {
      this.rooms.push(roomObj);
    }
  }

  removeRoom(roomTitle) {
    console.log(`Removing Room ${roomTitle}`);
    for (let i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].roomTitle === roomTitle) {
        this.rooms.splice(i, 1);
      }
    }
  }
}

module.exports = Namespace;
