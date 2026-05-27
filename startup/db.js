const mongoose = require("mongoose");

module.exports = function () {
  const db = process.env.MONGO_URL;
  mongoose
    .connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log(`Mongo dp connecteds...`);
    })
    .catch((error) => {
      console.log("-----------", error);
      console.log(`not connected..Node is Exiting...! ${error}`);
      process.exit(1);
    });
};
