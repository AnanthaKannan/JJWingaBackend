const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
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
      enum: ["user", "admin"],
      default: ["user"],
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  { versionKey: false, timestamps: true },
);

// Hash password before saving
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
