import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IScore extends Document {
  studentId: Types.ObjectId;
  assigned: number; // homeworkAssigned
  new: number; // homeworkNew
  progress: number; // homeworkProgress
  completed: number; // homeworkCompleted
  correct: number; // homeworkCorrect
  wrong: number; // homeworkWrong
  timeTaken: number; // homeworkTimeTaken
  practiceAssigned: number;
  practiceNew: number;
  practiceProgress: number;
  practiceCompleted: number;
  practiceCorrect: number;
  practiceWrong: number;
  practiceTimeTaken: number;
}

const scoreSchema = new Schema<IScore>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    assigned: {
      // homeworkAssigned
      type: Number,
      default: 0,
    },
    new: {
      // homeworkNew
      type: Number,
      default: 0,
    },
    progress: {
      // homeworkProgress
      type: Number,
      default: 0,
    },
    completed: {
      // homeworkCompleted
      type: Number,
      default: 0,
    },
    correct: {
      // homeworkCorrect
      type: Number,
      default: 0,
    },
    wrong: {
      // homeworkWrong
      type: Number,
      default: 0,
    },
    timeTaken: {
      // homeworkTimeTaken
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

const Score: Model<IScore> = mongoose.model<IScore>("Score", scoreSchema);

export default Score;
