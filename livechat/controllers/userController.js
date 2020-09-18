const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { readFile } = require('fs');
const LivechatUser = require('../models/LivechatUser');
const BotUser = require('../models/BotUsers');
const Session = require('../models/Session');
const LivechatUserGroup = require('../models/LivechatUserGroup');
const LivechatAccessControl = require('../models/LivechatAccessControl');
const { sendEmail } = require('./emailController');

const { hashPassword, verifyPassword } = require('../password');

// exports.register = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//
//   const { firstName, lastName, password } = req.body;
//   let { email } = req.body;
//   email = email.toLowerCase();
//
//   const userExists = await LivechatUser.findOne({ email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') } });
//   if (userExists) throw 'User with same email already exits.';
//
//   const defaultGroup = await LivechatUserGroup.findOne({ name: 'default' });
//   hashPassword(password, async (err, hash) => {
//     if (err) {
//       throw 'Password hashing error';
//     }
//     // example hash that can be used to validate the password
//     const hashString = hash.toString('hex');
//     console.log(hashString);
//     const user = new LivechatUser({
//       created_at: Date.now(),
//       created_by: 'ffffffffffffffffffffffff',
//       updated_at: Date.now(),
//       updated_by: null,
//       is_active: true,
//       first_name: firstName,
//       last_name: lastName,
//       username: email,
//       email,
//       password: hashString,
//       livechat_agent_group_id: defaultGroup._id,
//       last_active: Date.now(),
//       force_change_password: false,
//       password_history: [],
//       invalid_login_attempts: 0,
//       is_locked: false,
//       last_password_change: Date.now(),
//       refresh_token_jti: '',
//     });
//     await user.save();
//     res.json({
//       message: `User [${email}] registered successfully!`,
//     });
//   });
// };

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName } = req.body;
  let { email } = req.body;
  email = email.toLowerCase();

  const userExists = await LivechatUser.findOne({ email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') } });
  if (userExists) throw 'User with same email already exits.';

  const defaultGroup = await LivechatUserGroup.findOne({ name: 'default' });
  const today = new Date();
  const expire = today.setDate(today.getDate() + 1);
  const token = crypto.randomBytes(32).toString('hex');
  const user = new LivechatUser({
    created_at: Date.now(),
    created_by: 'ffffffffffffffffffffffff',
    updated_at: Date.now(),
    updated_by: null,
    is_active: true,
    first_name: firstName,
    last_name: lastName,
    username: email,
    email,
    password: null,
    livechat_agent_group_id: defaultGroup._id,
    last_active: Date.now(),
    force_change_password: true,
    password_history: [],
    invalid_login_attempts: 0,
    is_locked: false,
    last_password_change: Date.now(),
    refresh_token_jti: '',
    password_reset: {
      token,
      expire,
    },
  });
  await user.save();
  const url = `${process.env.FRONTEND_DOMAIN_URL}/reset-password/${token}`;
  readFile('static/create-password.html', 'utf8', async (err, html) => {
    if (err) {
      return console.log(err);
    }
    const result = html.replace(/A8F5F167F44F4964E6C998DEE827110C/g, url);
    await sendEmail(email, 'Livechat Verification Email', result);

    res.json({
      message: `User [${email}] registered successfully! Please click on the verification link in your email.`,
    });
  });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { password } = req.body;
  let { email } = req.body;
  email = email.toLowerCase();
  const user = await LivechatUser.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

  if (!user) throw 'Your account information was entered incorrectly.';

  if (user.is_locked) {
    return res.status(403).json({
      message: 'Your account is currently locked, please contact the administrator to reset your account',
    });
  }

  verifyPassword(password, user.password, async (err, correct) => {
    if (err) {
      return 1;
    }
    if (correct) {
      user.last_active = Date.now();
      user.invalid_login_attempts = 0;
      await user.save();

      // for Permissions
      const userGroup = await LivechatUserGroup.findOne({ _id: user.livechat_agent_group_id });
      const pipeline = [
        { $match: { _id: { $in: userGroup.access_control_ids.map((o) => mongoose.Types.ObjectId(o)) } } },
        { $group: { _id: null, permissions: { $addToSet: '$name' } } },
      ];
      // const query = {
      //   _id: {
      //     $in: userGroup.access_control_ids.map((o) => mongoose.Types.ObjectId(o)),
      //   },
      // };
      const cursor = await LivechatAccessControl.aggregate(pipeline);
      let permissions;
      cursor.forEach((doc) => {
        permissions = doc.permissions;
      }, (err) => {
        permissions = [];
      });
      const token = await jwt.sign({
        id: user._id,
        firstName: user.first_name,
        lastName: user.last_name,
        email,
        permissions,
      }, process.env.SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        message: 'User logged in successfully!',
        token,
      });
    } else {
      user.invalid_login_attempts += 1;

      if (user.invalid_login_attempts >= 5) {
        user.is_locked = true;
      }
      await user.save();
      res.status(401).json({
        message: 'Your account information was entered incorrectly.',
      });
    }
  });
};

exports.validate = async (req, res) => {
  // print params from URL
  console.log(req.params);
  const { token } = req.params;
  const query = {
    'password_reset.token': token,
    'password_reset.expire': {
      $gte: new Date(),
    },
  };
  const user = await LivechatUser.findOne(query);

  if (!user) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }
  res.json({
    message: 'Token is valid',
  });
};

exports.createPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { passwordOne, passwordTwo, token } = req.body;
  if (passwordOne !== passwordTwo) {
    return res.status(400).json({
      message: 'The password you entered does not match.',
    });
  }
  const query = {
    'password_reset.token': token,
    'password_reset.expire': {
      $gte: new Date(),
    },
  };
  const user = await LivechatUser.findOne(query);
  if (!user) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }

  hashPassword(passwordTwo, async (err, hash) => {
    if (err) {
      throw 'Password hashing error';
    }
    // example hash that can be used to validate the password
    const hashString = hash.toString('hex');
    console.log(hashString);
    user.updated_at = new Date();
    user.password = hashString;
    user.force_change_password = false;
    user.last_password_change = new Date();
    user.password_reset = {};
    await user.save();
    res.json({
      message: `User [${user.email}] password changed successfully!`,
    });
  });
};

exports.addTag = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const { id, tags } = req.body;
  const botUser = await BotUser.findOne({ _id: id });
  const sessionUser = await Session.findOne({ _id: id });
  const user = botUser || sessionUser;
  if (!user) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }
  user.tags = tags;
  const response = await user.save();
  res.json({
    message: 'Tags successfully updated',
  });
};

exports.readTag = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const { id } = req.body;
  const botUser = await BotUser.findOne({ _id: id });
  const sessionUser = await Session.findOne({ _id: id });
  const user = botUser || sessionUser;
  if (!user) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }
  res.json({
    user: user._id,
    tags: user.tags,
  });
};
