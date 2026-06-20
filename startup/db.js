const mongoose = require("mongoose");
const logger = require("../middleware/logger");

module.exports = function () {
  const db = process.env.MONGO_URL;
  mongoose
    .connect(db)
    .then(() => {
      logger.info("mongo_connected");
    })
    .catch((error) => {
      logger.fatal({ err: error }, "mongo_connection_failed");
      process.exit(1);
    });
};
