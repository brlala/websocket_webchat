const mongoose = require('mongoose');

const { Schema } = mongoose;

const LivechatAccessControlSchema = new Schema({
  _id: Schema.Types.ObjectId,
  name: String,
  category: String,
  method: String,
}, { collection: 'livechat_access_control', versionKey: false });

module.exports = mongoose.model('LivechatAccessControlSchema', LivechatAccessControlSchema);
