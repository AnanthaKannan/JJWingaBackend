const jwt = require("jsonwebtoken");
// const logger  = require('../startup/logging');

module.exports = function (req, res, next) {

  const token = req.header("x-access-token");
  if (!token) {
    console.log(`Request to API name${req.path} failed no token is sent`)
    return res.status(401).json({
      status: 401,
      message: "Access denied. No token provided."
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_ENCODE_KEY);
    req.user = decoded;
    console.log(`Request to API name - ${req.path} ${req.user.email}`)
    next();
  } catch (ex) {
    console.log(`Request to API name${req.path} failed no token is Invalid`)
    // logger.error(`Request to API name${req.path} failed no token is Invalid`);
    return res.status(401).json({
      status: 401,
      message: "Invalid token."
    });
  }
};
