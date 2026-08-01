import mongoose, { Schema, Document, Model } from "mongoose";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

export interface IOtpVerification extends Document {
  email: string;
  otpHash: string;
  purpose: string;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
    default: "academy-creation",
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index: MongoDB auto-deletes this document ~10 min after creation
    expires: OTP_TTL_SECONDS,
  },
});

// Speeds up "find latest OTP for this email + purpose" lookups
otpVerificationSchema.index({ email: 1, purpose: 1, createdAt: -1 });

const OtpVerification: Model<IOtpVerification> =
  mongoose.model<IOtpVerification>("OtpVerification", otpVerificationSchema);

export default OtpVerification;
