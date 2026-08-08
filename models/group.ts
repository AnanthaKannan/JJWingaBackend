import { Schema, model, Document, Types } from "mongoose";

export interface IGroup extends Document {
  groupName: string;
  userIds: Types.ObjectId[];
  orgId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    userIds: [
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

export const GroupModel = model<IGroup>("Group", GroupSchema);

export default GroupModel;
