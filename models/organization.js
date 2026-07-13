const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
    },
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
    billCycle: {
      from: {
        type: Date,
        default: new Date(), // remove
      },
      to: {
        type: Date,
        default: new Date(), // remove
      },
    },
    billGeneratedDate: {
      type: Date,
      default: new Date(), // remove
    },
    dueDate: {
      type: Date,
      default: new Date(), // remove
    },
    totalStudentOnBillDate: {
      type: Number,
      default: 10, // remove
    },
    paymentEnable: {
      type: Boolean,
      default: false,
    },
    pricePerStudent: {
      type: Number,
      default: 19,
    },
    amount: {
      type: Number,
      default: 200, //
    },
    state: {
      type: String,
      enum: ["paid", "unpaid", "free"],
      default: "free",
    },
    appEmailId: {
      type: String,
      default: "sreeananthakannan@gmail.com",
    },
  },
  { versionKey: false },
);

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
