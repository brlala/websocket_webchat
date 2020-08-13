const mongoose = require('mongoose');

module.exports.getDb = function () {
  return mongoose;
};

exports.initialize = function (dbUrl) {
  mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  const { connection } = mongoose;
  connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
  });
  return mongoose;
};
