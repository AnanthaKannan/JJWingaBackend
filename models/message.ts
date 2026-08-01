import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MessageParticipantModel = "Admin" | "Student";

export interface IMessage extends Document {
  message: string;
  sendBy: Types.ObjectId;
  sendByModel: MessageParticipantModel;
  receivedTo: Types.ObjectId;
  receivedToModel: MessageParticipantModel;
  hasRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    sendBy: {
      type: Schema.Types.ObjectId,
      refPath: "sendByModel",
      required: [true, "Sender reference is required"],
    },
    sendByModel: {
      type: String,
      enum: ["Admin", "Student"],
      required: true,
    },
    receivedTo: {
      type: Schema.Types.ObjectId,
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

const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema,
);

export default Message;
