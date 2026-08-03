// models/Like.ts
import { Schema, model, Document, Types, Model } from "mongoose";
import { UserTypeSch } from "../types";

export interface ILike extends Document {
  feedId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: UserTypeSch;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    feedId: { type: Schema.Types.ObjectId, ref: "Feed", required: true },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
    },
    userType: {
      type: String,
      required: true,
      enum: ["Student", "Admin"] as UserTypeSch[],
    },
  },
  { timestamps: true },
);

likeSchema.index({ feedId: 1, userId: 1, userType: 1 }, { unique: true });

const Like: Model<ILike> = model<ILike>("Like", likeSchema);

export default Like;
