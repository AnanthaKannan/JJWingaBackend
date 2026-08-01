import mongoose, { Schema, Document, Model } from "mongoose";

export type OrganizationState = "paid" | "unpaid" | "free";

export interface IOrganization extends Document {
  name: string;
  profilePicPath: string;
  studentPrefix: string;
  email: string;
  teacherPrefix: string;
  studentIdGen: number;
  teacherIdGen: number;
  billMonth: {
    from?: Date;
    to?: Date;
  };
  totalStudent?: number;
  pricePerStudent: number;
  total?: number;
  state: OrganizationState;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicPath: {
      type: String,
      trim: true,
      default: "",
    },
    studentPrefix: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    teacherPrefix: {
      type: String,
      required: true,
      unique: true,
    },
    studentIdGen: {
      type: Number,
      default: 100,
    },
    teacherIdGen: {
      type: Number,
      default: 100,
    },
    billMonth: {
      from: {
        type: Date,
      },
      to: {
        type: Date,
      },
    },
    totalStudent: {
      type: Number,
    },
    pricePerStudent: {
      type: Number,
      default: 19,
    },
    total: {
      type: Number,
    },
    state: {
      type: String,
      enum: ["paid", "unpaid", "free"],
      default: "free", // Optional
    },
  },
  { versionKey: false },
);

const Organization: Model<IOrganization> = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);

export default Organization;
