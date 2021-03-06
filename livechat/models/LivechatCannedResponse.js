const mongoose = require('mongoose');

const { Schema } = mongoose;

const LivechatCannedResponseSchema = new Schema({
  agent_id: Schema.Types.ObjectId,
  name: String,
  text: {},
  category: String,
  type: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date,
}, { collection: 'livechat_canned_response', versionKey: false });

module.exports = mongoose.model('LivechatCannedResponse', LivechatCannedResponseSchema);
