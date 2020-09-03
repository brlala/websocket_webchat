const mongoose = require('mongoose');

const { Schema } = mongoose;

const BotSchema = new Schema({
  name: String,
  abbreviation: String,
  outgoing: Map,
  enabled_platforms: [String],
  facebook: Map,
  line: Map,
  slack: Map,
  telegram: Map,
  whatsapp: Map,
  widget: Map,
  bot2bot: Map,
  gateway: Map,
  rabbitmq: new Schema({
    rabbitmq_uri: String,
    rabbitmq_gateway_to_chatbot: String,
    rabbitmq_chatbot_to_nlp: String,
    rabbitmq_nlp_to_chatbot: String,
    rabbitmq_chatbot_to_gateway: String,
    rabbitmq_gateway_to_livechat: String,
    rabbitmq_livechat_to_gateway: String,
    rabbitmq_bot2bot: String,
    rabbitmq_broadcast: String,
    rabbitmq_testing: String,
  }),
  redis: Map,
  chatbot: Map,
  nlp: Map,
  portal: Map,
  livechat: Map,
  monitor: Map,
  is_active: Boolean,
}, { collection: 'bot', versionKey: false });

module.exports = mongoose.model('Bot', BotSchema);
