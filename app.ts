import "dotenv/config";
import "express-async-errors";

import express from "express";
import logger from "./middleware/logger";
import setupCors from "./startup/cors";
import setupRoutes from "./startup/routes";
import setupDb from "./startup/db";

const app = express();

setupCors(app);
app.use(express.json());
setupRoutes(app);
setupDb();

const port = process.env.PORT;
app.listen(port, () => {
  logger.info({ port }, "server_listening");
});
