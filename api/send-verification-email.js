// api/send-verification-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, verificationCode, fullName } = body || {};

    if (!email || !verificationCode) {
      console.error('Missing required fields:', { email, verificationCode });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📧 Sending verification email to:', email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'ambertouch2026@gmail.com',
        pass: process.env.SMTP_PASS || 'ohlk dzqx nfdz mpeu',
      },
    });

    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Email HTML
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px; text-align: center;">
          <h1 style="font-size: 24px; color: #333; margin: 0; font-weight: 400; letter-spacing: 2px;">Amber Touch</h1>
          <p style="font-size: 12px; color: #888; margin: 2px 0 0;">Email Verification</p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin: 0 0 4px;">Dear ${fullName || 'Customer'},</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 20px;">Thank you for registering with Amber Touch. Please use the verification code below to complete your registration:</p>
        
        <div style="background: #f7f7f7; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
          <p style="margin: 8px 0 0; font-size: 36px; font-weight: 700; color: #d4a574; letter-spacing: 8px;">${verificationCode}</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #888;">This code expires in 10 minutes</p>
        </div>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #888;">Didn't request this verification?</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #555;">If you didn't create an account with Amber Touch, please ignore this email.</p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">Amber Touch • Luxury Fragrances</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #bbb;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;

    const text = `
  ════════════════════════════════════════
          AMBER TOUCH
  ════════════════════════════════════════

  Email Verification

  Dear ${fullName || 'Customer'},

  Thank you for registering with Amber Touch.
  Please use the verification code below to complete your registration:

  ════════════════════════════════════════
      VERIFICATION CODE: ${verificationCode}
  ════════════════════════════════════════

  This code expires in 10 minutes

  Didn't request this verification?
  If you didn't create an account with Amber Touch,
  please ignore this email.

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  `;

    const info = await transporter.sendMail({
      from: `"Amber Touch" <${process.env.SMTP_USER || 'ambertouch2026@gmail.com'}>`,
      to: email,
      subject: 'Verify Your Amber Touch Account',
      html: html,
      text: text,
    });

    console.log('✅ Verification email sent:', info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Verification email sent successfully'
    });

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
