const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: [true, "Question ID is required"],
      trim: true,
      // e.g. "5A-01"
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
    },
    type: {
      type: String,
      enum: ["homework", "exam", "practice"],
      required: [true, "Question type is required"],
      default: "homework",
    },
    questions: {
      type: Array,
      default: [],
    },
    marks: {
      type: Array,
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
    oral: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
