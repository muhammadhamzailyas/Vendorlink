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
            from: process.env.EMAIL_FROM || '"Vendorlink" <support.vendorlink@gmail.com>',
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
            <h1 style="font-size: 24px;">Welcome to Vendorlink, ${user.fullName}!</h1>
            <p>Your registration is successful and is now being reviewed by our team.</p>
            <p><strong>Account Type:</strong> ${user.role.toUpperCase()}</p>
            <p>We will notify you once your account is verified.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from Vendorlink.</p>
        </div>
    `;
    return this.sendEmail({
        to: user.email,
        subject: "Welcome to Vendorlink - Application Received",
        html
    });
  }

  async sendRejectionEmail(email, fullName, reason) {
    const onboardingUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/onboarding`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px; color: #ef4444;">Application Update</h1>
            <p>Hello ${fullName},</p>
            <p>Thank you for your interest in Vendorlink. After reviewing your profile application, we unfortunately cannot approve it at this time.</p>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">Reason for rejection:</p>
                <p style="margin: 10px 0 0 0; color: #b91c1c;">${reason}</p>
            </div>
            <p>You can update your profile information and re-submit your application by following the link below:</p>
            <a href="${onboardingUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Update & Re-apply</a>
            <p style="margin-top: 20px;">If you have any questions, feel free to reply to this email.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from Vendorlink.</p>
        </div>
    `;
    return this.sendEmail({
        to: email,
        subject: "Action Required: Your Vendorlink Application",
        html
    });
  }

  async sendNewPasswordEmail(email, newPassword, fullName) {
      const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Password Reset</h1>
            <p>Hello ${fullName}, your new password is:</p>
            <div style="background: #f4f4f5; padding: 15px; font-family: monospace; font-size: 18px; border-radius: 8px; margin: 10px 0;">
                ${newPassword}
            </div>
            <p>Please log in and change it immediately.</p>
            <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background: #18181b; color: white; text-decoration: none; border-radius: 8px;">Log In</a>
        </div>
      `;
      return this.sendEmail({
        to: email,
        subject: "Your New Password - Vendorlink",
        html
    });
  }

  async sendApprovalEmail(user) {
    const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/${user.role}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px; color: #10b981;">Account Approved!</h1>
            <p>Hello ${user.fullName || "User"},</p>
            <p>We are excited to inform you that your Vendorlink account has been successfully verified and approved.</p>
            <p>You now have full access to our platform to ${user.role === 'company' ? 'post tasks and hire expert vendors' : 'browse tasks and submit proposals'}.</p>
            <div style="margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
            </div>
            <p>Welcome aboard!</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from Vendorlink.</p>
        </div>
    `;
    return this.sendEmail({
        to: user.email,
        subject: "Your Vendorlink Account is Approved!",
        html
    });
  }

  async sendVerificationEmail(email, code) {
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Verify Your Email</h1>
            <p>Thank you for registering with Vendorlink. Please use the following 6-digit code to verify your email address:</p>
            <div style="background: #f4f4f5; padding: 15px; font-family: monospace; font-size: 32px; font-bold; text-align: center; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
                ${code}
            </div>
            <p>Enter this code in the verification window to complete your registration.</p>
            <p>If you did not create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from Vendorlink.</p>
        </div>
    `;
    return this.sendEmail({
        to: email,
        subject: `${code} is your Vendorlink verification code`,
        html
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/reset-password?token=${token}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
            <h1 style="font-size: 24px;">Reset Your Password</h1>
            <p>You requested a password reset for your Vendorlink account. Click the button below to set a new password:</p>
            <div style="margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated message from Vendorlink.</p>
        </div>
    `;
    return this.sendEmail({
        to: email,
        subject: "Password Reset Request - Vendorlink",
        html
    });
  }
}

module.exports = new EmailService();
