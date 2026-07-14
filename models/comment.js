const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema(
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

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
