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
    teacherIdGen: {
      type: Number,
      default: 100,
    },
    billMonth: {
      from: {
        type: Date,
      },
      to: {
        type: Date,
      },
    },
    totalStudent: {
      type: Number,
    },
    pricePerStudent: {
      type: Number,
      default: 19,
    },
    total: {
      type: Number,
    },
    state: {
      type: String,
      enum: ["paid", "unpaid", "free"],
      default: "free", // Optional
    },
    appEmailId: {
      type: String,
      default: "sreeananthakannan@gmail.com",
    },
    appUpiId: {
      type: String,
    },
  },
  { versionKey: false },
);

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
