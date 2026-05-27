const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: [true, 'Question ID is required'],
      unique: true,
      trim: true,
      // e.g. "5A-01"
    },
    questions: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;