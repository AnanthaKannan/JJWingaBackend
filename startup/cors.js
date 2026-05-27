const cors = require("cors");

module.exports = function(app) {
  var corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    exposedHeaders: "*",
    optionsSuccessStatus: 204
  };
  app.use(cors());
};

///
