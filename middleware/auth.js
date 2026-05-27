const jwt = require("jsonwebtoken");
// const logger  = require('../startup/logging');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const authenticate = (req, res, next) => {

  const token = req.header("x-access-token");
  if (!token) {
    console.log(`Request to API name${req.path} failed no token is sent`)
    return res.status(401).json({
      status: 401,
      message: "Access denied. No token provided."
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

const generateToken = (payload,) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


module.exports = {
  authenticate,
  generateToken
}