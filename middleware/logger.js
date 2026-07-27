const pino = require("pino");

let pinoData = {};

if (process.env.NODE_ENV !== "LOCAL") {
  pinoData = {
    transport: {
      target: "pino-loki",
      options: {
        host: process.env.LOKI_HOST,
        basicAuth: {
          username: process.env.LOKI_USER_ID,
          password: process.env.LOKI_API_KEY,
        },
        labels: {
          app: "jjwings-backend",
          env: process.env.NODE_ENV || "production",
        },
        batching: true,
        interval: 5,
      },
    },
  };
}

const logger = pino(pinoData);

module.exports = logger;
