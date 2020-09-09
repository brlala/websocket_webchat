const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const LivechatUser = require('../models/LivechatUser');
const LivechatUserGroup = require('../models/LivechatUserGroup');

const { hashPassword, verifyPassword } = require('../password');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    firstName, lastName, email, password,
  } = req.body;

  const userExists = await LivechatUser.findOne({ email });
  if (userExists) throw 'User with same email already exits.';

  const defaultGroup = await LivechatUserGroup.findOne({ name: 'default' });
  hashPassword(password, async (err, hash) => {
    if (err) {
      throw 'Password hashing error';
    }
    // example hash that can be used to validate the password
    const hashString = hash.toString('hex');
    console.log(hashString);
    const user = new LivechatUser({
      created_at: Date.now(),
      created_by: 'ffffffffffffffffffffffff',
      updated_at: Date.now(),
      updated_by: Date.now(),
      is_active: true,
      first_name: firstName,
      last_name: lastName,
      username: email,
      email,
      password: hashString,
      livechat_user_group_id: defaultGroup._id,
      last_active: Date.now(),
      force_change_password: false,
      password_history: [],
      invalid_login_attempts: 0,
      is_locked: false,
      last_password_change: Date.now(),
      refresh_token_jti: '',
    });
    await user.save();
    res.json({
      message: `User [${email}] registered successfully!`,
    });
  });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await LivechatUser.findOne({ email });

  if (!user) throw 'Your account information was entered incorrectly.';

  verifyPassword(password, user.password, async (err, correct) => {
    if (err) {
      return 1;
    }
    if (correct) {
      user.last_active = Date.now();
      await user.save();

      const token = await jwt.sign({
        id: user._id,
        firstName: user.first_name,
        lastName: user.last_name,
        email,
      }, process.env.SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        message: 'User logged in successfully!',
        token,
      });
    } else {
      user.invalid_login_attempts += 1;
      await user.save();
      res.status(401).json({
        message: 'Your account information was entered incorrectly.',
      });
    }
  });
};
