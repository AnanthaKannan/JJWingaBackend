const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: [true, "Question ID is required"],
      unique: true,
      trim: true,
      // e.g. "5A-01"
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
    },
    questions: {
      type: Array,
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
