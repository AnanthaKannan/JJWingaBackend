const mongoose = require("mongoose");

const fileUploadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "File upload name is required"],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    fileFormat: {
      type: String,
      required: [true, "File format is required"],
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["practice", "celebration"],
      required: [true, "File upload type is required"],
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const FileUpload = mongoose.model("FileUpload", fileUploadSchema);

module.exports = FileUpload;
