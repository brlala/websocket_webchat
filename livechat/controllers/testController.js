const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailController');
const LivechatUser = require('../models/LivechatUser');
const BotUser = require('../models/BotUsers');

async function test(req, res) {
  // print params from URL
  console.log(req.params);
  const { email } = req.payload;
  res.json({
    message: 'authentication succeed',
    email,
  });
}

async function emailUser(req, res) {
  const { email, subject, html } = req.body;
  // print params from URL
  const response = await sendEmail(email, subject, html);
  res.json({
    message: 'email succeed',
    email,
  });
}

async function search(req, res) {
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
}

async function reset(req, res) {
  // print params from URL
  const results = await BotUser.updateMany({}, { chat_state: 'bot' });
  res.json({
    results,
  });
}

const add = (a, b) => a + b;
const mul = (a, b) => a * b;
const sub = (a, b) => a - b;
const div = (a, b) => a / b;

module.exports = {
  test,
  emailUser,
  search,
  reset,
  add,
  mul,
  sub,
  div,
};
