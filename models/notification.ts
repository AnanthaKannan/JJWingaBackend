import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SentByModel = "Admin" | "Student";

export interface INotification extends Document {
  studentId?: Types.ObjectId;
  adminId?: Types.ObjectId;
  messageHeader: string;
  messageBody: string;
  sentBy: Types.ObjectId;
  sentByModel: SentByModel;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    adminId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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

notificationSchema.pre("validate", function (this: INotification) {
  if (!this.studentId && !this.adminId) {
    this.invalidate(
      "studentId",
      "Either studentId or adminId is required for a notification",
    );
  }
});

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 864000 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);

export default Notification;
