import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../utils/mailer";
import { Organization, OtpVerification } from "../models";
import {
  UserType,
  IOtpVerification,
  IOrganization,
  ServiceResult,
} from "../types";

const OTP_PURPOSE = "academy-creation" as const;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// --- Types -----------------------------------------------------------

// --- Helpers -----------------------------------------------------------

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

/**
 * Generates, stores (hashed), and emails a new OTP for the given email.
 * Returns a plain domain result — { success, message, errorCode? }.
 * No HTTP concerns (status codes) live here; that's the controller's job.
 */
async function sendOtpService(email: string): Promise<ServiceResult> {
  if (!email) {
    return {
      success: false,
      errorCode: "MISSING_EMAIL",
      message: "Email is required",
    };
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Enforce a cooldown so the same email can't be spammed with requests
  const existing = (await OtpVerification.findOne({
    email: normalizedEmail,
    purpose: OTP_PURPOSE,
  }).sort({ createdAt: -1 })) as IOtpVerification | null;

  if (existing) {
    const secondsSinceLast = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      return {
        success: false,
        errorCode: "COOLDOWN_ACTIVE",
        message: `Please wait ${waitSeconds}s before requesting another code`,
      };
    }
    // A new OTP invalidates any previous one for this email
    await OtpVerification.deleteMany({
      email: normalizedEmail,
      purpose: OTP_PURPOSE,
    });
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await OtpVerification.create({
    email: normalizedEmail,
    otpHash,
    purpose: OTP_PURPOSE,
  });

  // await sendOtpEmail(normalizedEmail, otp);

  return { success: true, message: "OTP sent successfully" };
}

/**
 * Verifies a submitted OTP against the stored hash for that email.
 * Returns a plain domain result — { success, message, errorCode? }.
 * No HTTP concerns (status codes) live here; that's the controller's job.
 */
async function verifyOtpService(
  email: string,
  otp: string,
): Promise<ServiceResult> {
  if (!email || !otp) {
    return {
      success: false,
      errorCode: "MISSING_FIELDS",
      message: "Email and OTP are required",
    };
  }
  const normalizedEmail = email.trim().toLowerCase();

  const record = (await OtpVerification.findOne({
    email: normalizedEmail,
    purpose: OTP_PURPOSE,
  }).sort({ createdAt: -1 })) as IOtpVerification | null;

  if (!record) {
    return {
      success: false,
      errorCode: "OTP_NOT_FOUND",
      message: "No active OTP found. Please request a new one.",
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: record._id });
    return {
      success: false,
      errorCode: "TOO_MANY_ATTEMPTS",
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return {
      success: false,
      errorCode: "INCORRECT_OTP",
      message: "Incorrect OTP. Please try again.",
    };
  }

  record.verified = true;
  await record.save();

  return { success: true, message: "Email verified successfully" };
}

const verifyPrefix = async (
  prefix: string,
  type: UserType,
): Promise<boolean> => {
  type IsExisting = IOrganization | null;

  if (type === "student") {
    const isExist: IsExisting = await Organization.findOne({
      studentPrefix: prefix,
    });

    if (isExist) return false;
  } else {
    const isExist: IsExisting = await Organization.findOne({
      teacherPrefix: prefix,
    });

    if (isExist) return false;
  }

  return true;
};

export { sendOtpService, verifyOtpService, verifyPrefix };
