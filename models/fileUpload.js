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
    type: {
      type: String,
      enum: ["practice", "celebration"],
      required: [true, "File upload type is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const FileUpload = mongoose.model("FileUpload", fileUploadSchema);

module.exports = FileUpload;
