const mongoose = require('mongoose');

const { Schema } = mongoose;

const Message = new Schema({
  data: {
    type: Map,
    of: String,
  },
  type: String,
  platform: String,
  sender_platform_id: String,
  receiver_platform_id: String,
  abbr: String,
}, { collection: 'messages', versionKey: false });

module.exports = mongoose.model('Message', Message);
