const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    if (!req.headers.authorization) throw 'Forbidden access missing authorization header';
    const token = req.headers.authorization.split(' ')[1];

    // verify token
    const payload = jwt.verify(token, process.env.SECRET);
    req.payload = payload;
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Forbidden access, token invalid',
    });
  }
};
