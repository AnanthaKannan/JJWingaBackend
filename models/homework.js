const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required'],
    },
    results: {
      type: [Boolean],
      default: [],
    },
    answers: {
      type: [Number], // can be positive or negative
      default: [],
    },
    state: {
      type: String,
      enum: ['NEW', 'COMPLETED', 'PROGRESS'],
      required: [true, 'State is required'],
      default: 'NEW',
    },
    timer: {
      type: Number,
      default: 0,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

const HomeWork = mongoose.model('HomeWork', homeworkSchema);

module.exports = HomeWork;