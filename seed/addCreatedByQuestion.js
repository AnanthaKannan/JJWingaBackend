require("dotenv").config();

const mongoose = require("mongoose");
const { Question } = require("../models");

const run = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(process.env.MONGO_URL);
  const adminId = "6a16d4108349e449c87c7806";

  await Question.updateMany(
    {},
    {
      $set: {
        createdBy: adminId,
      },
    },
  );
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
