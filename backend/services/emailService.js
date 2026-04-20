const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Priority: SMTP Config -> Gmail Config -> Null
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log("Professional SMTP Email service initialized.");
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log("Gmail Email service initialized.");
    } else {
      console.warn("Email credentials not configured. Emails will NOT be sent.");
    }
  }

  async sendEmail({ to, subject, html }) {
    if (!this.transporter) return { success: false, error: "Transporter not ready" };
    try {
        const info = await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || '"VendorLink" <noreply@vendorlink.com>',
            to,
            subject,
            html
        });
        return { success: true, info };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error };
    }
  }

  async sendOnboardingWelcome(user) {
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Welcome to VendorLink, ${user.fullName}!</h1>
            <p>Your registration is successful and is now being reviewed by our team.</p>
            <p><strong>Account Type:</strong> ${user.role.toUpperCase()}</p>
            <p>We will notify you once your account is verified.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from VendorLink.</p>
        </div>
    `;
    return this.sendEmail({
        to: user.email,
        subject: "Welcome to VendorLink - Application Received",
        html
    });
  }

  async sendVerificationEmail(user, token, code) {
      const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Verify your email address</h1>
            <p>Hi ${user.fullName || user.email},</p>
            <p>Thanks for registering. Please verify your email address by entering the code below or clicking the button:</p>
            
            <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 12px; margin: 20px 0; color: #111827; border: 1px solid #e4e4e7;">
                ${code}
            </div>

            <div style="text-align: center;">
                <a href="${verifyUrl}" style="display: inline-block; margin: 10px 0; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify via Link</a>
            </div>

            <p style="margin-top: 20px;">If the button does not work, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #71717a;">${verifyUrl}</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from VendorLink. The code will expire in 15 minutes.</p>
        </div>
      `;
      return this.sendEmail({
          to: user.email,
          subject: `${code} is your VendorLink verification code`,
          html,
      });
  }

  async sendNewPasswordEmail(email, newPassword, username) {
      const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Password Reset</h1>
            <p>Hello ${username}, your new password is:</p>
            <div style="background: #f4f4f5; padding: 15px; font-family: monospace; font-size: 18px; border-radius: 8px; margin: 10px 0;">
                ${newPassword}
            </div>
            <p>Please log in and change it immediately.</p>
            <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background: #18181b; color: white; text-decoration: none; border-radius: 8px;">Log In</a>
        </div>
      `;
      return this.sendEmail({ to: email, subject: "Your New Password - VendorLink", html });
  }
}

module.exports = new EmailService();
