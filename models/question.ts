import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type QuestionType = "homework" | "exam" | "practice";

export interface IQuestion extends Document {
  questionId: string; // e.g. "5A-01"
  level: number;
  type: QuestionType;
  questions: string[];
  marks: string[];
  createdBy: Types.ObjectId;
  oral: boolean;
  isDeleted: boolean;
  orgId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
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
      type: [Schema.Types.String],
      default: [],
    },
    marks: {
      type: [Schema.Types.String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
    versionKey: false,
  },
);

const Question: Model<IQuestion> = mongoose.model<IQuestion>(
  "Question",
  questionSchema,
);

export default Question;
