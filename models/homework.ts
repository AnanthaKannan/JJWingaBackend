import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type HomeworkState = "NEW" | "COMPLETED" | "PROGRESS";

export interface IHomeWork extends Document {
  questionId: Types.ObjectId;
  results: boolean[];
  answers: number[]; // can be positive or negative
  state: HomeworkState;
  timer: number;
  appreciateSend: boolean;
  studentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homeworkSchema = new Schema<IHomeWork>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"],
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
      enum: ["NEW", "COMPLETED", "PROGRESS"],
      required: [true, "State is required"],
      default: "NEW",
    },
    timer: {
      type: Number,
      default: 0,
    },
    appreciateSend: {
      type: Boolean,
      default: false,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

homeworkSchema.index({ studentId: 1, questionId: 1 });

const HomeWork: Model<IHomeWork> = mongoose.model<IHomeWork>(
  "HomeWork",
  homeworkSchema,
);

export default HomeWork;
