const express = require("express");
const routes = require("../routes");
const comment = require("../routes/comment");
const error = require("./error");
const swagger = require("./swagger");
const responseTracker = require("../middleware/responseTracker");

module.exports = function (app) {
  app.use(express.json());
  // swagger(app);
  app.use(responseTracker);
  app.use("/v1/api", routes);
  app.use("/v1/api/comment", comment);
  app.use(error);
};
