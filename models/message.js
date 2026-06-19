const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    sendBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sendByModel",
      required: [true, "Sender reference is required"],
    },
    sendByModel: {
      type: String,
      enum: ["Admin", "Student"],
      required: true,
    },
    receivedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receivedToModel",
      required: [true, "Receiver reference is required"],
    },
    receivedToModel: {
      type: String,
      enum: ["Admin", "Student"],
      required: true,
    },
    hasRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
