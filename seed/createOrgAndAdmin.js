require("dotenv").config();

const mongoose = require("mongoose");
const { addOrganization, addAdmin } = require("../service/index");

const run = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(process.env.MONGO_URL);

  const orgReq = {
    name: "JJ Brain Wings",
    studentPrefix: "JJ",
    teacherPrefix: "JW",
  };

  const adminName = "Sobhana";

  const adminReq = { roles: ["superadmin"], name: adminName };

  const orgResult = await addOrganization(orgReq);
  adminReq.orgId = orgResult._id;
  const adminResult = await addAdmin(adminReq);

  console.log("adminResult", adminResult);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
