const nodemailer = require("nodemailer");

// Requires a Gmail App Password (not your regular Gmail password):
// Google Account -> Security -> 2-Step Verification -> App Passwords
// Set these in your .env:
//   GMAIL_USER=youracademyapp@gmail.com
//   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // must be false for 587 — it starts unencrypted then upgrades via STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  family: 4,
});

export async function sendOtpEmail(toEmail: string, otp: string) {
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

export async function sendWelcomeEmail(
  toEmail: string,
  academyName: string,
  adminId: string,
  password: string,
) {
  const mailOptions = {
    from: `"JJWings" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to JJWings — Your Academy is Ready",
    html: `
      <div style="font-family: -apple-system, Arial, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4C5FE8; margin-bottom: 8px;">Welcome to JJWings, ${academyName}!</h2>
        <p style="color: #374151; font-size: 14px; line-height: 20px;">
          Your academy has been successfully set up. Use the admin credentials below to log in and get started.
        </p>
        <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">ADMIN ID</p>
          <p style="color: #1A1D29; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${adminId}</p>
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px 0;">PASSWORD</p>
          <p style="color: #1A1D29; font-size: 16px; font-weight: 600; margin: 0;">${password}</p>
        </div>
        <p style="color: #374151; font-size: 14px; line-height: 20px;">
          For security, we recommend changing your password after your first login.
        </p>
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't request this account, please contact our support team.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export default { sendOtpEmail, sendWelcomeEmail };
