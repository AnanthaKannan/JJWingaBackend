import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGameScore extends Document {
  studentId: Types.ObjectId;
  level: number;
  points: number;
  updatedAt: Date;
}

const gameScoreSchema = new Schema<IGameScore>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

// One record per student per level — prevents duplicates
gameScoreSchema.index({ studentId: 1, level: 1 }, { unique: true });

// Speeds up top-5-per-level queries
gameScoreSchema.index({ level: 1, points: -1 });

export default mongoose.model<IGameScore>("GameScore", gameScoreSchema);
