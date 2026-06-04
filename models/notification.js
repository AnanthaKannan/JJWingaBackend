const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
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
      refPath: "sentByModel",
      required: [true, "Sender reference is required"],
    },
    sentByModel: {
      type: String,
      enum: ["Admin", "Student"],
      default: "Admin",
      required: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

notificationSchema.pre("validate", function (next) {
  if (!this.studentId && !this.adminId) {
    this.invalidate(
      "studentId",
      "Either studentId or adminId is required for a notification",
    );
  }

  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
