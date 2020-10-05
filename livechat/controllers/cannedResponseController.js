const { validationResult } = require('express-validator');
const LivechatCannedResponse = require('../models/LivechatCannedResponse');

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const { id } = req.payload;
  const {
    name, text, language, category,
  } = req.body;

  // check if response already exist
  if (name) {
    const responseExists = await LivechatCannedResponse.findOne({ name, agent_id: id });
    if (responseExists) {
      const error = {
        msg: 'Response already exist',
        responseName: name,
        responseId: responseExists._id,
      };
      return res.status(400)
        .json({ errors: [error] });
    }
  }

  const cannedResponse = new LivechatCannedResponse({
    agent_id: id,
    name,
    category,
    type: 'custom',
    text: { [language]: text },
    is_active: true,
    selected: false,
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
  const query = { $or: [{ agent_id: id }, { agent_id: null }] };
  const responses = await LivechatCannedResponse.find(query);
  res.json({
    responses,
  });
};

exports.edit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const { id } = req.payload;
  const { responseId, updatedResponse } = req.body;
  updatedResponse.updated_at = Date.now();
  updatedResponse.agent_id = id;
  const response = await LivechatCannedResponse.findOneAndReplace({
    _id: responseId,
    agent_id: id,
  }, updatedResponse, {
    new: true,
  });
  res.json({
    response,
  });
};

exports.delete = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const { id } = req.payload;
  const { responseId } = req.body;
  const response = await LivechatCannedResponse.findOneAndUpdate({
    _id: responseId,
    agent_id: id,
  }, { is_active: false }, {
    new: true,
  });
  res.json({
    response,
  });
};
