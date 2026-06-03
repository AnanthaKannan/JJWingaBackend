require("dotenv").config();

const mongoose = require("mongoose");
const { seedAdminScreenData } = require("./index");

const run = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  const result = await seedAdminScreenData();

  console.log(
    result.admin.created
      ? "Admin JW001 created"
      : "Admin JW001 already exists",
  );
  console.log(`IdGen studentLastId: ${result.idGen.data.studentLastId}`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
