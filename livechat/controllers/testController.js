const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailController');
const LivechatUser = require('../models/LivechatUser');

exports.test = async (req, res) => {
  // print params from URL
  console.log(req.params);
  const { email } = req.payload;
  res.json({
    message: 'authentication succeed',
    email,
  });
};

exports.email = async (req, res) => {
  const { email, subject, html } = req.body;
  // print params from URL
  const response = await sendEmail(email, subject, html);
  res.json({
    message: 'email succeed',
    email,
  });
};

exports.search = async (req, res) => {
  const { email } = req.body;
  // print params from URL
  const cursor = await LivechatUser.find({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  let users = [];
  cursor.forEach(
    (doc) => {
      users.push(doc);
      console.log(doc);
    },
  );
  res.json({
    users,
  });
};
