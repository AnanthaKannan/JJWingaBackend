import mongoose, { Schema, Document, Model, Types } from "mongoose";
import bcrypt from "bcryptjs";

import { uniqueStringArray } from "@utils";

export interface IStudent extends Document {
  studentId: string;
  deviceIds: string[];
  name: string;
  password: string;
  level: number;
  vertical: boolean;
  isDeleted: boolean;
  fcmTokens: string[];
  profilePicPath: string;
  deletedDate: Date | null;
  createdBy: Types.ObjectId;
  orgId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
    },
    deviceIds: {
      type: [String],
      default: [],
      set: uniqueStringArray,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
    },
    vertical: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    fcmTokens: {
      type: [String],
      default: [],
      // Array to support multiple devices per student
    },
    profilePicPath: {
      type: String,
      trim: true,
      default: "",
    },
    deletedDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

// Hash password before saving
studentSchema.pre("save", async function (this: IStudent) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const Student: Model<IStudent> = mongoose.model<IStudent>(
  "Student",
  studentSchema,
);

export default Student;
