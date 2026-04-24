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
            from: process.env.EMAIL_FROM || '"VendorLink" <support.vendorlink@gmail.com>',
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
