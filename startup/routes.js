const express = require("express");
const routes = require("../routes");
const error = require("./error");
const swagger = require("./swagger");

module.exports = function (app) {
  app.use(express.json());
  swagger(app);
  app.use("/v1/api", routes);
  app.use(error);
};
