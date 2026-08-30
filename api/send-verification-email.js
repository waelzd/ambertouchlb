// api/send-verification-email.js
import nodemailer from 'nodemailer';

// Store verification codes temporarily (in memory)
// In production, you might want to use Redis or a database
const verificationStore = {};

// Generate a random 4-digit code
const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, fullName, action } = body || {};

    if (!email) {
      console.error('Missing email field');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Sending verification email to:', email);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store the code with timestamp (expires in 10 minutes)
    verificationStore[email] = {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    };

    console.log('✅ Verification code generated:', verificationCode);

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'ambertouch2026@gmail.com',
        pass: process.env.SMTP_PASS || 'ohlk dzqx nfdz mpeu',
      },
    });

    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // HTML email template
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; color: #333; margin: 0; font-weight: 400;">Amber Touch</h1>
          <p style="font-size: 12px; color: #888; margin: 2px 0 0;">Email Verification</p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin: 0 0 4px;">Dear ${fullName || 'Customer'},</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 20px;">Thank you for creating an account with Amber Touch. Please verify your email address using the code below:</p>
        
        <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #d4a574;">
          <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
          <p style="margin: 8px 0 0; font-size: 42px; font-weight: 700; color: #d4a574; letter-spacing: 8px; font-family: monospace;">${verificationCode}</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #999;">This code expires in 10 minutes</p>
        </div>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #888;">Why verify?</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #555; line-height: 1.5;">
            ✅ Secure your account<br>
            ✅ Access exclusive offers<br>
            ✅ Track your orders<br>
            ✅ Get personalized recommendations
          </p>
        </div>
        
        <p style="font-size: 13px; color: #555; margin: 16px 0 4px;">If you didn't create an account with Amber Touch, please ignore this email.</p>
        
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

  Email Verification

  Dear ${fullName || 'Customer'},

  Thank you for creating an account with Amber Touch.
  Please verify your email address using the code below:

  ────────────────────────────────────────
        VERIFICATION CODE
    ${verificationCode}
  ────────────────────────────────────────
  
  This code expires in 10 minutes.

  Why verify?
  ✅ Secure your account
  ✅ Access exclusive offers
  ✅ Track your orders
  ✅ Get personalized recommendations

  If you didn't create an account with Amber Touch,
  please ignore this email.

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  `;

    try {
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
        message: 'Verification email sent successfully',
        messageId: info.messageId
      });
    } catch (error) {
      console.error('❌ Email failed:', error);
      return res.status(500).json({
        error: 'Failed to send verification email',
        details: String(error)
      });
    }

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}