const mongoose = require('mongoose');

const { Schema } = mongoose;

const Session = new Schema({
  _id: Schema.Types.ObjectId,
  last_active: Map,
  bot_id: Schema.Types.ObjectId,
  platform: String,
  widget: Map,
  created_at: Date,
  updated_at: Date,
  is_active: Boolean,
  chat_state: String,
  end_at: Date,
}, { collection: 'session', versionKey: false });

module.exports = mongoose.model('Session', Session);
