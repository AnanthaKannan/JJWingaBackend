const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
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
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
