import { Schema, model, Document, Types } from "mongoose";

export interface IGroup extends Document {
  groupName: string;
  studentIds: Types.ObjectId[];
  orgId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  messages: string[];
}

const GroupSchema = new Schema<IGroup>(
  {
    messages: {
      type: [
        {
          text: {
            type: String,
            trim: true,
            // we could not make it required, because while create the group there is no message
          },
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
  },
  { timestamps: true },
);

GroupSchema.index({ orgId: 1, createdBy: 1 });

export const GroupModel = model<IGroup>("Group", GroupSchema);

export default GroupModel;
