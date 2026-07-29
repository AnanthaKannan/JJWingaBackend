import { Request, Response } from "express";
import * as orgService from "../service/org.service"; // adjust path
import { AddOrgParam, UserType } from "../types";
import { addAdmin } from "../service";
import { sendWelcomeEmail } from "../utils/mailer";
import logger from "../middleware/logger";

// Maps domain-level error codes (from the service layer) to HTTP status
// codes. This is the only place that knows about HTTP — the service layer
// stays framework-agnostic and just describes what went wrong.
const ERROR_STATUS_MAP: Record<string, number> = {
  MISSING_EMAIL: 400,
  MISSING_FIELDS: 400,
  DUPLICATE: 400,
  COOLDOWN_ACTIVE: 429,
  OTP_NOT_FOUND: 400,
  TOO_MANY_ATTEMPTS: 429,
  INCORRECT_OTP: 400,
  EMAIL_SEND_FAILED: 400,
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

const logControllerError = (context: string, error: unknown) => {
  logger.error({ err: error, context }, "controller_error");
};

async function sendOtp(req: Request<{}, {}, SendOtpBody>, res: Response) {
  try {
    const { email } = req.body;
    const result = await orgService.sendOtpService(email);
    return res.status(statusFor(result)).json({
      success: result.success,
      otp: result.otp, // TODO Remove OTP from the response
      message: result.message,
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    logControllerError("sendOtpController", error);
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
    logControllerError("verifyOtpController", error);
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

  return res.status(200).json({
    success: true,
    isPrefixAvailable,
    message: "Successfully verified",
  });
};

const addOrganization = async (
  req: Request<{}, {}, AddOrgParam>,
  res: Response,
) => {
  const body = req.body;
  const orgId = await orgService.addOrganization(body);

  const roles = ["superadmin"];
  const profilePicPath = "";
  const result = await addAdmin({
    name: body.adminName,
    orgId,
    roles,
    profilePicPath,
  });
  const { email, name } = body;
  await sendWelcomeEmail(email, name, result.adminId, result.password);

  return res.status(200).json({
    success: true,
    message: "Successfully Org and admin created",
    result,
  });
};

export { sendOtp, verifyOtp, verifyPrefix, addOrganization };
