const mongoose = require("mongoose");

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

const otpVerificationSchema = new mongoose.Schema({
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

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
