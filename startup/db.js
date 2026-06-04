const mongoose = require("mongoose");

module.exports = function () {
  const db = process.env.MONGO_URL;
  mongoose
    .connect(db)
    .then(() => {
      console.log(`Mongo dp connected...`);
    })
    .catch((error) => {
      console.log("-----------", error);
      console.log(`not connected..Node is Exiting...! ${error}`);
      process.exit(1);
    });
};
