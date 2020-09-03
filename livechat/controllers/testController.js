const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

exports.test = async (req, res) => {
  const { email } = req.body;
  res.json({
    message: 'authentication succeed',
    email,
  });
};
