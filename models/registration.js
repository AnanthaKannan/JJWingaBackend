const mongoose = require("mongoose");

const trimString = (value) => (typeof value === "string" ? value.trim() : value);

const siblingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
    },
    standard: {
      type: String,
      trim: true,
      default: "",
    },
    sex: {
      type: String,
      enum: ["male", "female", "other", ""],
      lowercase: true,
      trim: true,
      default: "",
      set: trimString,
    },
    schoolNameAndAddress: {
      type: String,
      trim: true,
      default: "",
    },
    admissionType: {
      type: String,
      enum: ["new_enrollment", "transfer_in", "other_instruction", ""],
      default: "",
    },
    previousCenterNameAndAddress: {
      type: String,
      trim: true,
      default: "",
    },
    fatherName: {
      type: String,
      trim: true,
      default: "",
    },
    fatherQualification: {
      type: String,
      trim: true,
      default: "",
    },
    fatherOfficeAddress: {
      type: String,
      trim: true,
      default: "",
    },
    motherName: {
      type: String,
      trim: true,
      default: "",
    },
    motherQualification: {
      type: String,
      trim: true,
      default: "",
    },
    motherOccupation: {
      type: String,
      trim: true,
      default: "",
    },
    residentialAddress: {
      type: String,
      trim: true,
      default: "",
    },
    fatherMobileNo: {
      type: String,
      trim: true,
      default: "",
    },
    motherMobileNo: {
      type: String,
      trim: true,
      default: "",
    },
    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    siblings: {
      type: [siblingSchema],
      default: [],
    },
    studentCode: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfAdmission: {
      type: Date,
    },
    level: {
      type: String,
      trim: true,
      default: "",
    },
    batchNo: {
      type: String,
      trim: true,
      default: "",
    },
    batchDate: {
      type: Date,
    },
    batchTime: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;
