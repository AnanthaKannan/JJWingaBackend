const mongoose = require("mongoose");
const config = require("config");
module.exports = function () {
  const db = process.env.MONGO_URL;
  mongoose
    .connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => {
      console.log(`Mongo dp connecteds... ${db}`)
    }).catch((error) => {
      console.log(`${db} not connected..Node is Exiting...! ${error}`);
      process.exit(1);
    });
};
