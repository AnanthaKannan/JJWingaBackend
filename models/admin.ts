import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type AdminRole = "admin" | "superadmin";

export interface IAdmin extends Document {
  adminId: string;
  name: string;
  roles: AdminRole[];
  password: string;
  fcmTokens: string[];
  isDeleted: boolean;
  deletedDate: Date | null;
  profilePicPath: string;
  orgId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    adminId: {
      type: String,
      required: [true, "Admin ID is required"],
      unique: true,
      trim: true,
      // e.g. "JW001"
    },
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    roles: {
      type: [String],
      enum: ["admin", "superadmin"],
      default: ["admin"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    fcmTokens: {
      type: [String],
      default: [],
      // Array to support multiple devices per student
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedDate: {
      type: Date,
      default: null,
    },
    profilePicPath: {
      type: String,
      trim: true,
      default: "",
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  { versionKey: false, timestamps: true },
);

// Hash password before saving
adminSchema.pre<IAdmin>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
