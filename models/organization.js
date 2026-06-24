const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicPath: {
      type: String,
      trim: true,
      default: "",
    },
    studentPrefix: {
      type: String,
      required: true,
      unique: true,
    },
    teacherPrefix: {
      type: String,
      required: true,
      unique: true,
    },
    studentIdGen: {
      type: Number,
      default: 100,
    },
    pricePerStudent: {
      type: Number,
      default: 19,
    },
    teacherIdGen: {
      type: Number,
      default: 100,
    },
  },
  { versionKey: false },
);

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
