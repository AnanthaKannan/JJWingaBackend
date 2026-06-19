const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const packageJson = require("../package.json");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JJ Wings Backend API",
      version: packageJson.version,
    },
    servers: [
      {
        url: "/v1/api",
        description: "Current server",
      },
    ],
    tags: [
      { name: "Auth" },
      { name: "Students" },
      { name: "Questions" },
      { name: "Homework" },
      { name: "Scores" },
      { name: "Ranking" },
      { name: "Notifications" },
      { name: "Uploads" },
    ],
  },
  apis: ["./docs/swagger.js"],
});

module.exports = function (app) {
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
