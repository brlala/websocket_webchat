const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

function dbConnect() {
// Establish MongoDB connection
  console.log(`Connecting to MongoDB database ${process.env.DB_SERVER}:${process.env.DB_PORT} database ${process.env.ABBREVIATION}...`);
  const mongoUrl = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_AUTH_DATABASE}`;

  // Initiate connection:
  mongoose.connect(mongoUrl, {
    dbName: process.env.DB_DATABASE, // Connect to the specified database
    useNewUrlParser: true, // Use new settings
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // autoIndex: process.env.DB_AUTO_INDEX, // Autoindex
    // reconnectTries: Number.MAX_VALUE, // Keep retrying forever (thanks https://stackoverflow.com/a/39684734/1502289 and https://stackoverflow.com/a/41923785/1502289)
    // reconnectInterval: 5000, // Time to wait between reconnection attempts
  })
    .then(() => {
      console.log('MongoDB connection successful');
    })
    .catch((err) => {
      console.log('MongoDB connection error', err);
    });

  // Set up database event handlers:
  const db = mongoose.connection;
  db.on('error', (err) => { console.error(`Unable to connect to database.  Error: ${err}`); });
  db.once('open', () => { console.log('Mongoose database connection established.'); });
  db.on('disconnected', () => { console.log('MongoDB disconnected.'); });
  db.on('reconnected', () => { console.log('Mongoose reconnected.'); });

  return mongoose;
}

module.exports.getDb = function () {
  return mongoose;
};

module.exports.validateObjectId = function (idToCheck) {
  return idToCheck && ObjectId.isValid(idToCheck) && new ObjectId(idToCheck) == idToCheck ? idToCheck : null;
};

exports.initialize = dbConnect;

// exports.initialize = function (dbUrl) {
//   mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
//   const { connection } = mongoose;
//   connection.once('open', () => {
//     console.log('MongoDB database connection established successfully');
//   });
//   return mongoose;
// };
