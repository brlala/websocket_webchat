const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
  type: String,
  data: {
    text: String,
    url: String,
    urls: {},
    items: {},
  },
  chatbot: Map,
  platform: String,
  incoming_message_id: String,
  sender_platform_id: String,
  session_id: Schema.Types.ObjectId,
  abbr: String,
  sender_id: Schema.Types.ObjectId,
  receiver_id: Schema.Types.ObjectId,
  timing: Map,
  created_at: Date,
  handler: String,
  created_by: Schema.Types.ObjectId,
  updated_at: Date,
  updated_by: Schema.Types.ObjectId,
  widget: Map,
}, { collection: 'message', versionKey: false });

module.exports = mongoose.model('Message', MessageSchema);
