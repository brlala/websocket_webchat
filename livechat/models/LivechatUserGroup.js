const mongoose = require('mongoose');

const { Schema } = mongoose;

const LivechatUserGroupSchema = new Schema({
  name: String,
  access_control_ids: [Schema.Types.ObjectId],
  is_active: Boolean,
  created_at: Date,
  updated_at: Date,
  created_by: Schema.Types.ObjectId,
  updated_by: Schema.Types.ObjectId,

}, { collection: 'livechat_user_group', versionKey: false });

module.exports = mongoose.model('LivechatUserGroup', LivechatUserGroupSchema);
