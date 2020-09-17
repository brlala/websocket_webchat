const mongoose = require('mongoose');

const { Schema } = mongoose;

const SessionSchema = new Schema({
  last_active: Map,
  bot_id: Schema.Types.ObjectId,
  platform: String,
  widget: Map,
  created_at: Date,
  updated_at: Date,
  is_active: Boolean,
  chat_state: String,
  end_at: Date,
  tags: [String],
}, { collection: 'session', versionKey: false });

module.exports = mongoose.model('Session', SessionSchema);
