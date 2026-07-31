require("dotenv").config();

const mongoose = require("mongoose");
const { Student, FileUpload, Admin, Question } = require("../models");

// const run = async () => {
//   if (!process.env.MONGO_URL) {
//     throw new Error("MONGO_URL is not configured");
//   }

//   await mongoose.connect(process.env.MONGO_URL);
//   const orgId = "6a49fb05a959016ba54b1493";

//   await Student.updateMany({}, { $set: { orgId } });
//   await FileUpload.updateMany({}, { $set: { orgId } });
//   await Admin.updateMany({}, { $set: { orgId } });
//   await Question.updateMany({}, { $set: { orgId } });
// };

// run()
//   .catch((error) => {
//     console.error(error.message);
//     process.exitCode = 1;
//   })
//   .finally(async () => {
//     await mongoose.disconnect();
//   });
