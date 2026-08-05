import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CommentUserType = "Student" | "Admin";

export interface IComment extends Document {
  feedId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: CommentUserType;
  content: string;
  parentId: Types.ObjectId | null; // null = top-level comment, otherwise points to the top-level comment
  replyCount: number;
  feedOwnerId: Types.ObjectId;
  orgId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  approved: boolean;
}

const commentSchema = new Schema<IComment>(
  {
    feedId: {
      type: Schema.Types.ObjectId,
      ref: "Feed",
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
    approved: {
      type: Boolean,
      default: false,
    },
    feedOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
  },
  { timestamps: true },
);

// compound index for the most common query: top-level comments for a image, sorted
commentSchema.index({
  orgId: 1,
  feedId: 1,
  parentId: 1,
  approved: 1,
  createdAt: -1,
});
commentSchema.index({ orgId: 1, feedOwnerId: 1, approved: 1, createdAt: -1 });

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema,
);

export default Comment;
