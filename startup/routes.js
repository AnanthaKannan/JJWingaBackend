const express = require("express");
const admin = require("../routes/admin");
const error = require("./error")
module.exports = function(app) {
    app.use(express.json());
    app.use("/api/admin", admin);
    app.use(error)
}