import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TFeedType = "file" | "content";

export interface IFeed extends Document {
  filePath?: string;
  type: TFeedType;
  content?: string;
  orgId: Types.ObjectId;
  commentCount: number;
  likeCount: number;
  likedBy: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feedSchema = new Schema<IFeed>(
  {
    filePath: {
      type: String,
      trim: true,
      required: [
        function (this: IFeed) {
          return this.type === "file";
        },
        "File path is required when type is 'file'",
      ],
    },
    content: {
      type: String,
      trim: true,
      required: [
        function (this: IFeed) {
          return this.type === "content";
        },
        "Content is required when type is 'content'",
      ],
    },
    type: {
      type: String,
      enum: ["file", "content"],
      required: [true, "type is required"],
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator (Admin) reference is required"],
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

feedSchema.index({ orgId: 1 });

const Feed: Model<IFeed> = mongoose.model<IFeed>("Feed", feedSchema);

export default Feed;
