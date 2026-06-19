// const logger = require("../middleware/logger");
module.exports = function (err, req, res, _next) {
  console.error(err.message, err);
  res.status(500).json({
    status: 500,
    success: false,
    message: "Something failed...",
    err: err.message,
  });
};
