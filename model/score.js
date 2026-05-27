const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    completed: {
      type: Number,
      default: 0,
    },
    failure: {
      type: Number,
      default: 0,
    },
    success: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    assigned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;