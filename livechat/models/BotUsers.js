const mongoose = require('mongoose');

const { Schema } = mongoose;

const BotUserSchema = new Schema({
  _id: Schema.Types.ObjectId,
  first_name: String,
  last_name: String,
  email: String,
  gender: String,
  profile_pic_url: String,
  auth_flag: Number,
  is_broadcast_subscribed: Boolean,
  last_active: Map,
  bot_id: Schema.Types.ObjectId,
  bot_user_group_id: Schema.Types.ObjectId,
  platforms: [String],
  facebook: Map,
  chat_state: String,
  created_at: Date,
  created_by: String,
  updated_at: Date,
  updated_by: String,
  is_active: Boolean,
}, { collection: 'bot_user', versionKey: false });

module.exports = mongoose.model('BotUser', BotUserSchema);
