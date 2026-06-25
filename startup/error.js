const logger = require("../middleware/logger");

module.exports = function (err, req, res, _next) {
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
      userId: req?.user?.id,
      role: req?.user?.role,
      deviceId: req.headers["x-device-id"] || null,
    },
    "unhandled_request_error",
  );

  res.status(500).json({
    status: 500,
    success: false,
    message: "Something failed...",
    err: err.message,
  });
};
