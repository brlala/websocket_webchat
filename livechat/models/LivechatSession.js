const mongoose = require('mongoose');

const { Schema } = mongoose;

const LivechatSessionSchema = new Schema({
  livechat_agent_id: Schema.Types.ObjectId,
  bot_user_id: Schema.Types.ObjectId,
  session_id: Schema.Types.ObjectId,
  start_datetime: Date,
  end_datetime: Date,
  is_active: Boolean,
}, { collection: 'livechat_session', versionKey: false });

module.exports = mongoose.model('LivechatSession', LivechatSessionSchema);
