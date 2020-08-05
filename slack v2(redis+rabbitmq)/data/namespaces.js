// Bring in the room class
const Namespace = require('../classes/Namespace');
const Room = require('../classes/Room');

// Set up the namespaces
const namespaces = [];
const generalNs = new Namespace(0, 'General', 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png', '/wiki');
// const mozNs = new Namespace(1, 'Mozilla', 'https://www.mozilla.org/media/img/logos/firefox/logo-quantum.9c5e96634f92.png', '/mozilla');
// const linuxNs = new Namespace(2, 'Linux', 'https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png', '/linux');

// Make the main room and add it to rooms. it will ALWAYS be 0
generalNs.addRoom(new Room(0, 'New Articles', 'Wiki'));
generalNs.addRoom(new Room(1, 'Editors', 'Wiki'));
generalNs.addRoom(new Room(2, 'Other', 'Wiki'));

namespaces.push(generalNs);

module.exports = namespaces;
