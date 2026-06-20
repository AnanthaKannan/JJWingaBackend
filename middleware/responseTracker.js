const logger = require("./logger");

const responseTracker = (req, res, next) => {
  if (req.path === "/v1/api/health" || req.path === "/") {
    return next();
  }

  const startTime = Date.now();

  if (req.path === "/v1/api/health" || req.path === "/") {
    return next();
  }

  res.on("finish", () => {
    const responseSize = res.getHeader("Content-Length") || 0;
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userId: req?.user?.id,
      name: req?.user?.name,
      role: req?.user?.role,
      body: JSON.stringify(req?.body || {}),
      // Response size (from header, no override needed)
      responseSizeBytes: parseInt(responseSize),
      responseSizeKB: (parseInt(responseSize) / 1024).toFixed(2),

      // Response time
      durationMs: duration,

      // Device context
      deviceId: req.headers["x-device-id"],
      appVersion: req.headers["x-app-version"],
      networkType: req.headers["x-network-type"],
    };
    logger.info(logData, "api_response");
  });

  next();
};

module.exports = responseTracker;
