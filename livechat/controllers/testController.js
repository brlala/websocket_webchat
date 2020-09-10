const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

exports.test = async (req, res) => {
  // print params from URL
  console.log(req.params);
  const { email } = req.payload;
  res.json({
    message: 'authentication succeed',
    email,
  });
};
