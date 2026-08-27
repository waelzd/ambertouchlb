// api/send-reset-password-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, resetLink } = body || {};

    if (!email) {
      console.error('Missing required field: email');
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!resetLink) {
      console.error('Missing required field: resetLink');
      return res.status(400).json({ error: 'Reset link is required' });
    }

    console.log('📧 Sending password reset email to:', email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'ambertouch2026@gmail.com',
        pass: process.env.SMTP_PASS || 'ohlk dzqx nfdz mpeu',
      },
    });

    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const sendEmail = async (to, subject, html, text) => {
      try {
        const info = await transporter.sendMail({
          from: `"Amber Touch" <${process.env.SMTP_USER || 'ambertouch2026@gmail.com'}>`,
          to: to,
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]*>/g, ''),
        });
        console.log(`✅ Email to ${to} sent:`, info.messageId);
        return { status: 200, data: { messageId: info.messageId } };
      } catch (error) {
        console.error(`❌ Email to ${to} failed:`, error);
        return { status: 500, data: { error: String(error) } };
      }
    };

    // ============================================================
    // PASSWORD RESET EMAIL
    // ============================================================
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; color: #333; margin: 0; font-weight: 400;">Amber Touch</h1>
          <p style="font-size: 12px; color: #888; margin: 2px 0 0;">Password Reset</p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin: 0 0 4px;">Hello,</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 20px;">We received a request to reset the password for your AmberTouch account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p style="font-size: 14px; color: #555; margin: 0 0 16px;">To reset your password, click the button below:</p>
        
        <div style="text-align: center; margin: 28px 0 24px;">
          <a href="${resetLink}" style="display: inline-block; background: #d4a574; color: #ffffff; padding: 12px 40px; border-radius: 4px; text-decoration: none; font-size: 15px; font-weight: 500;">Reset Password</a>
        </div>
        
        <p style="font-size: 13px; color: #888; text-align: center; margin: 0 0 4px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="font-size: 13px; color: #d4a574; text-align: center; margin: 0 0 20px; word-break: break-all;">
          ${resetLink}
        </p>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #888;">
            <span style="font-weight: 600;">⚠️ Security Notice:</span> This link will expire in <span style="font-weight: 600;">24 hours</span> for your security.
          </p>
        </div>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; text-align: center; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #555;">For security reasons, we recommend resetting your password from a trusted device.</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Questions? <a href="mailto:ambertouch2026@gmail.com" style="color: #d4a574; text-decoration: none;">ambertouch2026@gmail.com</a></p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">Amber Touch • Luxury Fragrances</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #bbb;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;

    // Plain text version
    const text = `
  ════════════════════════════════════════
          AMBER TOUCH
  ════════════════════════════════════════

  Password Reset Request

  Hello,

  We received a request to reset the password for your AmberTouch account. If you didn't make this request, you can safely ignore this email.

  To reset your password, click the link below:

  ${resetLink}

  ════════════════════════════════════════
  ⚠️ Security Notice: This link will expire in 24 hours.

  For security reasons, we recommend resetting your password from a trusted device.

  Questions? ambertouch2026@gmail.com

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  `;

    // Send the email
    const result = await sendEmail(
      email,
      'Reset Your AmberTouch Password',
      html,
      text
    );

    return res.status(result.status).json({
      success: result.status === 200,
      message: result.status === 200 ? 'Password reset email sent successfully' : 'Failed to send email',
      data: result.data
    });

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}