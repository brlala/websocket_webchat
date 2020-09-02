const Bot = require('./models/Bot');

async function getBotConfig() {
  return Bot.findOne({
    abbreviation: process.env.ABBREVIATION,
    is_active: true,
  });
}

module.exports = {
  getBotConfig,
  currentAPIVersion: 3,
};
