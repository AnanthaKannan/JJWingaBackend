const nodemailer = require("nodemailer");

// Requires a Gmail App Password (not your regular Gmail password):
// Google Account -> Security -> 2-Step Verification -> App Passwords
// Set these in your .env:
//   GMAIL_USER=youracademyapp@gmail.com
//   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"JJWings" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your JJWings verification code",
    html: `
      <div style="font-family: -apple-system, Arial, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4C5FE8; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #374151; font-size: 14px; line-height: 20px;">
          Use the code below to verify your email address and continue setting up your academy.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1A1D29; margin: 24px 0;">
          ${otp}
        </p>
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
