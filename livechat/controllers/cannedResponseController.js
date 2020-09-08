const { body, validationResult } = require('express-validator');
const LivechatCannedResponse = require('../models/LivechatCannedResponse');

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.payload;
  const { name, text, language } = req.body;

  // check if response already exist
  const responseExists = await LivechatCannedResponse.findOne({ name });
  if (responseExists) {
    const error = {
      msg: 'Response already exist',
      responseName: name,
    };
    return res.status(400).json({ errors: [error] });
  }

  const cannedResponse = new LivechatCannedResponse({
    user: id,
    name,
    text: { [language]: text },
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  });
  const success = await cannedResponse.save();
  res.json({
    success,
  });
};

exports.read = async (req, res) => {
  const { id } = req.payload;
  const responses = await LivechatCannedResponse.find({ user: id });
  res.json({
    responses,
  });
};

exports.edit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { responseId, updatedResponse } = req.body;
  updatedResponse.updated_at = Date.now();
  const response = await LivechatCannedResponse.findOneAndReplace({ _id: responseId }, updatedResponse, {
    new: true,
  });
  res.json({
    response,
  });
};

exports.delete = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { responseId } = req.body;
  const response = await LivechatCannedResponse.findOneAndUpdate({ _id: responseId }, { is_active: false }, {
    new: true,
  });
  res.json({
    response,
  });
};
