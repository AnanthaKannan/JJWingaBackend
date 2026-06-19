const responseTracker = (req, res, next) => {
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
    console.log(JSON.stringify(logData));
  });

  next();
};

module.exports = responseTracker;
