const mongoose = require("mongoose");

const uniqueStringArray = (values) => [
  ...new Set(
    (Array.isArray(values) ? values : [values])
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
];

const studentSchema = new mongoose.Schema(
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
    vertical: {
      type: Boolean,
      default: false,
    },
    fcmTokens: {
      type: [String],
      default: [],
      // Array to support multiple devices per student
    },
    hasLoginSameDevice: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

// Hash password before saving
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 10);
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
