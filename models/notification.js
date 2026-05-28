const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    messageHeader: {
      type: String,
      required: [true, "Message header is required"],
      trim: true,
    },
    messageBody: {
      type: String,
      required: [true, "Message body is required"],
      trim: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
