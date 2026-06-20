require('dotenv').config();
require("express-async-errors");

const express = require("express");
const logger = require("./middleware/logger");
const app = express();

app.use(express.static('dist', {
    setHeaders: (_res, path, stat) => {
        logger.debug({ path, sizeBytes: stat?.size }, "static_asset_served")
    }
}));


require("./startup/cors")(app);
app.use(express.json());
require("./startup/routes")(app);
require("./startup/db")();

const port = process.env.PORT;
app.listen(port, () => {
    logger.info({ port }, "server_listening");
});
