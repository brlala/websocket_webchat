const { validationResult } = require('express-validator');

const sharp = require('sharp');
const { uploadFile } = require('../uploader');
const LivechatUser = require('../models/LivechatUser');

async function uploadProfilePicture(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }
  const { id } = req.payload;
  const { b64, mimetype, filename } = req.body;
  const imgBuffer = Buffer.from(b64, 'base64');
  try {
    const resizedProfilePicBuffer = await sharp(imgBuffer)
      .resize(200, 200, {
        fit: 'cover',
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      })
      .toBuffer();
    const botUser = await LivechatUser.findOne({ _id: id });
    botUser.profile_pic_url = await uploadFile(resizedProfilePicBuffer, mimetype, '', filename);
    botUser.save();
    res.json({
      message: 'Profile picture changed successfully!',
    });
  } catch {
    return res.status(400).json({
      errors: [{ msg: 'Upload of picture failed' }],
    });
  }
}

module.exports = {
  uploadProfilePicture,
};

// const base64 = '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';
//
// const mimeType = 'image/jpeg';
// uploadFile(base64, mimeType, 'testing', 'yo.jpg').then((asd) => {
//   console.log(asd);
// });
