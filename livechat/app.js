const express = require('express');
const cors = require('cors');

// Main
const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(`${__dirname}/public`));

// Setup cross origin
if (process.env.ENV === 'DEVELOPMENT') {
  app.use(cors());
} else {
  let corsOptions = {
    origin: process.env.ORIGIN,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  app.use(cors(corsOptions));
}

// Bringing in the routes
app.use('/:abbr/user', require('./routes/user'));
app.use('/:abbr/test', require('./routes/test'));
app.use('/:abbr/canned-response', require('./routes/cannedResponse'));

// Setup Error Handlers
const errorHandlers = require('./handlers/errorHandlers');

app.use(errorHandlers.notFound);
app.use(errorHandlers.mongooseErrors);
if (process.env.ENV === 'DEVELOPMENT') {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;
