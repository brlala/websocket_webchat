const mongoose = require('mongoose');

const { Schema } = mongoose;

const LivechatUserSchema = new Schema({
  created_at: Date,
  created_by: Schema.Types.ObjectId,
  updated_at: Date,
  updated_by: Date,
  is_active: Boolean,
  first_name: String,
  last_name: String,
  username: String,
  email: String,
  password: String,
  portal_user_group_id: Schema.Types.ObjectId,
  last_active: Date,
  force_change_password: Boolean,
  password_history: [String],
  invalid_login_attempts: Number,
  is_locked: Boolean,
  last_password_change: Date,
  refresh_token_jti: String,
}, { collection: 'livechat_user', versionKey: false });

module.exports = mongoose.model('LivechatUser', LivechatUserSchema);