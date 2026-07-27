const orgService = require("../service/org.service");

// Maps domain-level error codes (from the service layer) to HTTP status
// codes. This is the only place that knows about HTTP — the service layer
// stays framework-agnostic and just describes what went wrong.
const ERROR_STATUS_MAP = {
  MISSING_EMAIL: 400,
  MISSING_FIELDS: 400,
  COOLDOWN_ACTIVE: 429,
  OTP_NOT_FOUND: 400,
  TOO_MANY_ATTEMPTS: 429,
  INCORRECT_OTP: 400,
};

function statusFor(result) {
  if (result.success) return 200;
  return ERROR_STATUS_MAP[result.errorCode] || 400;
}

async function sendOtp(req, res) {
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

async function verifyOtp(req, res) {
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

const verifyPrefix = async (req, res) => {
  const { prefix, type } = req.body;
  const isPrefixAvailable = await orgService.verifyPrefix(prefix, type);

  return res.status(200).json({ success: true, isPrefixAvailable });
};

module.exports = { sendOtp, verifyOtp, verifyPrefix };
