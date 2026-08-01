import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type FileUploadType = "practice" | "celebration";

export interface IFileUpload extends Document {
  name: string;
  filePath: string;
  fileSize: number;
  fileFormat: string;
  type: FileUploadType;
  orgId: Types.ObjectId;
  commentCount: number;
  likeCount: number;
  likedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const fileUploadSchema = new Schema<IFileUpload>(
  {
    name: {
      type: String,
      required: [true, "File upload name is required"],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    fileFormat: {
      type: String,
      required: [true, "File format is required"],
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["practice", "celebration"],
      required: [true, "File upload type is required"],
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Creator (Organization) reference is required"],
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const FileUpload: Model<IFileUpload> = mongoose.model<IFileUpload>(
  "FileUpload",
  fileUploadSchema,
);

export default FileUpload;
