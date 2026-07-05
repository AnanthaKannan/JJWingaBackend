const logger = require("./logger");

const responseTracker = (req, res, next) => {
  if (req.path === "/v1/api/health" || req.path === "/") {
    return next();
  }

  const startTime = process.hrtime.bigint();
  const startCpu = process.cpuUsage();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const cpuUsage = process.cpuUsage(startCpu);
    const memory = process.memoryUsage();

    const responseSize = Number(res.getHeader("Content-Length")) || 0;
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userId: req?.user?.id,
      name: req?.user?.name,
      role: req?.user?.role,
      body: JSON.stringify(req.body || {}),

      deviceId: req.headers["x-device-id"] || null,

      // Performance
      durationMs: Number(durationMs.toFixed(2)),
      cpuUserMs: cpuUsage.user / 1000,
      cpuSystemMs: cpuUsage.system / 1000,

      // Memory
      rssMB: (memory.rss / 1024 / 1024).toFixed(2),
      heapUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (memory.heapTotal / 1024 / 1024).toFixed(2),
      externalMB: (memory.external / 1024 / 1024).toFixed(2),
      arrayBuffersMB: (memory.arrayBuffers / 1024 / 1024).toFixed(2),

      // Process
      uptimeSec: process.uptime().toFixed(2),
      pid: process.pid,

      // Request / Response
      requestSizeBytes: Buffer.byteLength(JSON.stringify(req.body || {})),

      responseSizeBytes: responseSize,
      responseSizeKB: (responseSize / 1024).toFixed(2),
    };

    logger.info(logData, "api_response");
  });

  next();
};

module.exports = responseTracker;
