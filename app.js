require('dotenv').config();
require("express-async-errors");

const express = require("express");
const app = express();
let counter = 0

app.use(express.static('dist', {
    setHeaders: (_res, _path, _stat) => {
        console.log(++counter)
    }
}));


require("./startup/cors")(app);
app.use(express.json());
require("./startup/routes")(app);
require("./startup/db")();

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
