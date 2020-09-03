const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

exports.test = async (req, res) => {
  const { email } = req.payload;
  res.json({
    message: 'authentication succeed',
    email,
  });
};
