import { Request, Response } from "express";
import * as orgService from "../service/org.service"; // adjust path
import { UserType } from "../types";

// Maps domain-level error codes (from the service layer) to HTTP status
// codes. This is the only place that knows about HTTP — the service layer
// stays framework-agnostic and just describes what went wrong.
const ERROR_STATUS_MAP: Record<string, number> = {
  MISSING_EMAIL: 400,
  MISSING_FIELDS: 400,
  COOLDOWN_ACTIVE: 429,
  OTP_NOT_FOUND: 400,
  TOO_MANY_ATTEMPTS: 429,
  INCORRECT_OTP: 400,
};

interface ServiceResult {
  success: boolean;
  message: string;
  errorCode?: string;
}

function statusFor(result: ServiceResult): number {
  if (result.success) return 200;
  return ERROR_STATUS_MAP[result.errorCode ?? ""] || 400;
}

interface SendOtpBody {
  email: string;
}

async function sendOtp(req: Request<{}, {}, SendOtpBody>, res: Response) {
  try {
    const { email } = req.body;
    const result = await orgService.sendOtpService(email);
    return res
      .status(statusFor(result))
      .json({ success: result.success, message: result.message });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
}

interface VerifyOtpBody {
  email: string;
  otp: string;
}

async function verifyOtp(req: Request<{}, {}, VerifyOtpBody>, res: Response) {
  try {
    const { email, otp } = req.body;
    const result = await orgService.verifyOtpService(email, otp);
    return res
      .status(statusFor(result))
      .json({ success: result.success, message: result.message });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify OTP" });
  }
}

interface VerifyPrefixBody {
  prefix: string;
  type: UserType;
}

const verifyPrefix = async (
  req: Request<{}, {}, VerifyPrefixBody>,
  res: Response,
) => {
  const { prefix, type } = req.body;
  const isPrefixAvailable = await orgService.verifyPrefix(prefix, type);

  return res.status(200).json({ success: true, isPrefixAvailable });
};

export { sendOtp, verifyOtp, verifyPrefix };
