import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CommentUserType = "Student" | "Admin";

export interface IComment extends Document {
  imageId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: CommentUserType;
  content: string;
  parentId: Types.ObjectId | null; // null = top-level comment, otherwise points to the top-level comment
  replyCount: number;
  isBlocked: boolean; // soft delete so reply threads don't break
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    imageId: {
      type: Schema.Types.ObjectId,
      ref: "FileUpload",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
    },
    userType: {
      type: String,
      required: true,
      enum: ["Student", "Admin"],
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    // null = top-level comment, otherwise points to the top-level comment
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false, // soft delete so reply threads don't break
    },
  },
  { timestamps: true },
);

// compound index for the most common query: top-level comments for a image, sorted
commentSchema.index({ imageId: 1, parentId: 1, createdAt: -1 });

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema,
);

export default Comment;
