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
    password: {
      type: String,
      required: [true, "Password is required"],
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
  },
  { versionKey: false },
);

// Hash password before saving
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
