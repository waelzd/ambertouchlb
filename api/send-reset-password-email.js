// server/send-reset-password-email.js
import nodemailer from 'nodemailer';

// Create transporter (same as your other email functions)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(email, resetLink) {
  try {
    const mailOptions = {
      from: `"AmberTouch" <${process.env.SMTP_FROM_EMAIL || 'noreply@ambertouchlb.com'}>`,
      to: email,
      subject: 'Reset Your AmberTouch Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - AmberTouch</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f5f5f0;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              padding: 32px 40px;
              text-align: center;
              border-bottom: 3px solid #c9a84c;
            }
            .header h1 {
              color: #c9a84c;
              font-size: 28px;
              font-weight: 300;
              letter-spacing: 4px;
              margin: 0;
              font-family: Georgia, serif;
            }
            .header p {
              color: #a0a0a0;
              font-size: 14px;
              margin: 4px 0 0 0;
              letter-spacing: 2px;
            }
            .content {
              padding: 40px;
              background: #ffffff;
            }
            .content h2 {
              color: #1a1a1a;
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 12px 0;
            }
            .content p {
              color: #4a4a4a;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 16px 0;
            }
            .content .greeting {
              font-size: 16px;
              color: #1a1a1a;
              margin-bottom: 12px;
            }
            .button-container {
              text-align: center;
              margin: 32px 0 24px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 48px;
              background: linear-gradient(135deg, #c9a84c 0%, #b8963a 100%);
              color: #1a1a1a;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              border-radius: 12px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 24px rgba(201, 168, 76, 0.4);
            }
            .divider {
              border: none;
              border-top: 1px solid #e8e8e0;
              margin: 32px 0;
            }
            .footer {
              text-align: center;
              padding: 24px 40px;
              background: #f8f8f4;
              border-top: 1px solid #e8e8e0;
            }
            .footer p {
              color: #8a8a8a;
              font-size: 13px;
              margin: 0 0 4px 0;
              line-height: 1.5;
            }
            .footer .brand {
              color: #c9a84c;
              font-weight: 600;
            }
            .footer .small {
              font-size: 12px;
              color: #a0a0a0;
            }
            .expiry-notice {
              background: #f8f8f4;
              border-radius: 8px;
              padding: 16px 20px;
              margin: 20px 0 0 0;
              font-size: 14px;
              color: #6a6a6a;
            }
            .expiry-notice span {
              font-weight: 600;
              color: #1a1a1a;
            }
            @media (max-width: 600px) {
              .container { border-radius: 0; }
              .header { padding: 24px 20px; }
              .header h1 { font-size: 22px; }
              .content { padding: 24px 20px; }
              .button { padding: 12px 32px; font-size: 15px; }
              .footer { padding: 16px 20px; }
            }
          </style>
        </head>
        <body style="margin:0;padding:20px;background-color:#f5f5f0;">
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>✦ AmberTouch</h1>
              <p>Luxury Fragrances</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2>Password Reset Request</h2>
              <p class="greeting">Hello,</p>
              <p>We received a request to reset the password for your AmberTouch account. If you didn't make this request, you can safely ignore this email.</p>
              <p>To reset your password, click the button below:</p>

              <div class="button-container">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>

              <p style="font-size:14px;color:#6a6a6a;text-align:center;">
                Or copy and paste this link into your browser:
                <br />
                <span style="color:#c9a84c;word-break:break-all;font-size:13px;">${resetLink}</span>
              </p>

              <div class="expiry-notice">
                <span>⚠️ Security Notice:</span> This link will expire in <span>24 hours</span> for your security.
              </div>

              <hr class="divider" />

              <p style="font-size:14px;color:#6a6a6a;text-align:center;margin:0;">
                For security reasons, we recommend resetting your password from a trusted device.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>
                <span class="brand">AmberTouch</span> — Luxury Fragrances
              </p>
              <p class="small">
                This email was sent to <span style="color:#4a4a4a;font-weight:500;">${email}</span>
              </p>
              <p class="small" style="margin-top:8px;">
                If you didn't request this, please ignore this email or contact our support team.
              </p>
              <p class="small" style="margin-top:8px;">
                © ${new Date().getFullYear()} AmberTouch. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}