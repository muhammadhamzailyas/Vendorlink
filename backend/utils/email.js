const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Try Gmail first
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // No email credentials configured
  console.warn("Email credentials not configured. Emails will not be sent.");
  return null;
};

const sendApprovalEmail = async (userEmail, companyName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const mailOptions = {
      from:
        process.env.EMAIL_USER || '"Vendor System" <noreply@vendorsystem.com>',
      to: userEmail,
      subject: "Account Approved - Vendor Collaboration System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Account Approved! 🎉</h2>
          <p>Dear ${companyName},</p>
          <p>Your account has been approved by the administrator.</p>
          <p>You can now login to your dashboard and start using the Vendor Collaboration System.</p>
          <br>
          <p><strong>Login URL:</strong> http://localhost:5173/login</p>
          <br>
          <p>Best regards,<br>Vendor System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

const sendRejectionEmail = async (userEmail, companyName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const mailOptions = {
      from:
        process.env.EMAIL_USER || '"Vendor System" <noreply@vendorsystem.com>',
      to: userEmail,
      subject: "Application Status - Vendor Collaboration System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Application Review Complete</h2>
          <p>Dear ${companyName},</p>
          <p>Thank you for your interest in our Vendor Collaboration System.</p>
          <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
          <br>
          <p>If you have questions, please contact our administrator.</p>
          <br>
          <p>Best regards,<br>Vendor System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

const sendPendingReviewEmail = async (userEmail, displayName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const mailOptions = {
      from:
        process.env.EMAIL_USER || '"Vendor System" <noreply@vendorsystem.com>',
      to: userEmail,
      subject: "Account Submitted - Pending Review",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Application Received ✅</h2>
          <p>Dear ${displayName},</p>
          <p>Your profile has been submitted successfully and is now <strong>pending admin verification</strong>.</p>
          <p>We will notify you as soon as your documents and plan are reviewed.</p>
          <br>
          <p>Best regards,<br>Vendor System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Pending review email failed:", error.message);
    return false;
  }
};

module.exports = { sendApprovalEmail, sendRejectionEmail, sendPendingReviewEmail };
