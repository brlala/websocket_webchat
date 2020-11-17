const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const fs = require('fs');
const util = require('util');
const handlebars = require('handlebars');
const LivechatUser = require('../models/LivechatUser');
const BotUser = require('../models/BotUsers');
const Session = require('../models/Session');
const LivechatUserGroup = require('../models/LivechatUserGroup');
const LivechatAccessControl = require('../models/LivechatAccessControl');
const { sendEmail } = require('./emailController');

const readFile = util.promisify(fs.readFile);

const { hashPassword, verifyPassword } = require('../password');

function formatEmailWithValue(emailText, replacements) {
  let template = handlebars.compile(emailText);
  return template(replacements);
}

async function sendPasswordResetEmail(token, email, fullname) {
  const resetPasswordUrl = `${process.env.FRONTEND_DOMAIN_URL}/reset-password/${token}`;
  const data = await readFile('static/create-password v1.html', 'utf8');
  let replacements = {
    fullname,
    resetPasswordUrl,
    expire: Number(process.env.LINK_EXPIRES_IN_DAYS) * 24,
    csmName: process.env.CSM_NAME,
    csmEmail: process.env.CSM_EMAIL,
    homeUrl: process.env.HOME_URL,
  };
  let htmlToSend = formatEmailWithValue(data, replacements);
  await sendEmail(email, 'Livechat Verification Email', htmlToSend);
}

function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function forgetPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  let { email } = req.body;
  email = email.toLowerCase();

  const user = await LivechatUser.findOne({
    email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') },
    is_active: true,
  });
  const msg = 'An email will be sent out to the following email if the user is registered.';
  if (!user) {
    console.log('not found');
    throw msg;
  }
  const today = new Date();
  const expire = today.setDate(today.getDate() + Number(process.env.LINK_EXPIRES_IN_DAYS));
  const token = crypto.randomBytes(32).toString('hex');
  user.password_reset = {
    token,
    expire,
  };
  await user.save();
  const fullname = `${user.last_name} ${user.first_name}`;
  await sendPasswordResetEmail(token, email, fullname);
  res.json({
    message: msg,
  });
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  const { id } = req.payload;
  const { firstName, lastName } = req.body;
  let { email } = req.body;
  email = email.toLowerCase();

  const userExists = await LivechatUser.findOne({
    email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') },
    is_active: true,
  });
  if (userExists) {
    return res.status(409).json({
      message: 'User with same email already exits.',
    });
  }

  const defaultGroup = await LivechatUserGroup.findOne({ name: 'default' });
  const today = new Date();
  const expire = today.setDate(today.getDate() + 1);
  const token = crypto.randomBytes(32).toString('hex');
  const user = new LivechatUser({
    created_at: Date.now(),
    created_by: id,
    updated_at: Date.now(),
    updated_by: null,
    is_active: true,
    first_name: firstName,
    last_name: lastName,
    username: email,
    email,
    password: null,
    profile_pic_url: '',
    livechat_agent_group_id: defaultGroup._id,
    last_active: Date.now(),
    force_change_password: true,

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
  const fullname = `${lastName} ${firstName}`;
  await sendPasswordResetEmail(token, email, fullname);
  res.json({
    message: `User [${email}] registered successfully! Please click on the verification link in your email.`,
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }
  const { password } = req.body;
  let { email } = req.body;
  email = email.toLowerCase();
  const user = await LivechatUser.findOne({
    email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') },
    is_active: true,
  });

  if (!user) {
    return res.status(401).json({
      message: 'Your account information is entered incorrectly.',
    });
  }

  if (!user.password) {
    return res.status(401).json({
      message: 'Please verify your email before proceeding with the login.',
    });
  }

  if (user.is_locked) {
    return res.status(403).json({
      message: 'Your account is currently locked, please contact the administrator to reset your account',
    });
  }

  console.log({ user, password });
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
        profilePicUrl: user.profile_pic_url,
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
}

async function validate(req, res) {
  // print params from URL
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
}

async function createPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
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
      return res.status(500).json({
        message: 'Password hashing error.',
      });
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
}

async function addTag(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
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
}

async function readTag(req, res) {
  const { id } = req.query;
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
}

module.exports = {
  formatEmailWithValue,
  escapeRegExp,
  forgetPassword,
  register,
  login,
  validate,
  createPassword,
  addTag,
  readTag,
};
