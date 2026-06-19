const express = require("express");
const routes = require("../routes");
const error = require("./error");
const swagger = require("./swagger");
const responseTracker = require("../middleware/responseTracker");

module.exports = function (app) {
  app.use(express.json());
  swagger(app);
  app.use(responseTracker);
  app.use("/v1/api", routes);
  app.use(error);
};
