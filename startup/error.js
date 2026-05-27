// const logger = require('../startup/logging');
module.exports = function (err, req, res, next) {
  console.error(err.message, err);
  res.status(500).json({
    status: 500,
    message: "Something failed...",
    err: err.message,
  });
};
