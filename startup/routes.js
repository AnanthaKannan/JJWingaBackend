const express = require("express");
const routes = require("../routes");
const error = require("./error");
module.exports = function (app) {
  app.use(express.json());
  app.use("/v1/api", routes);
  app.use(error);
};
