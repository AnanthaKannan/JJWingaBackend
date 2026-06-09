const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    assigned: {
      type: Number,
      default: 0,
    },
    new: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    wrong: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    practiceAssigned: {
      type: Number,
      default: 0,
    },
    practiceNew: {
      type: Number,
      default: 0,
    },
    practiceProgress: {
      type: Number,
      default: 0,
    },
    practiceCompleted: {
      type: Number,
      default: 0,
    },
    practiceCorrect: {
      type: Number,
      default: 0,
    },
    practiceWrong: {
      type: Number,
      default: 0,
    },
    practiceTimeTaken: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false },
);

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
