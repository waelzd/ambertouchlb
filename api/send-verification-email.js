// api/send-verification-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, code } = body || {};

    if (!email || !code) {
      console.error('Missing required fields:', { email, code });
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

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #d4a574; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="font-size: 24px; color: #333; margin: 0; font-weight: 400; letter-spacing: 2px;">Amber Touch</h1>
          <p style="font-size: 14px; color: #888; margin: 5px 0 0;">Email Verification</p>
        </div>
        
        <div style="text-align: center; padding: 10px 0;">
          <p style="font-size: 16px; color: #555; margin: 0 0 8px;">Welcome to Amber Touch!</p>
          <p style="font-size: 14px; color: #777; margin: 0 0 25px;">Please use the following code to verify your email address:</p>
          
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; display: inline-block; min-width: 200px;">
            <p style="font-size: 36px; font-weight: 700; color: #d4a574; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>
          
          <p style="font-size: 13px; color: #888; margin: 15px 0 0;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 13px; color: #888; margin: 5px 0 0;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
          <p style="margin: 0; font-size: 12px; color: #aaa;">Amber Touch • Luxury Fragrances</p>
          <p style="margin: 5px 0 0; font-size: 12px; color: #bbb;">
            <a href="mailto:ambertouch2026@gmail.com" style="color: #d4a574; text-decoration: none;">ambertouch2026@gmail.com</a>
          </p>
          <p style="margin: 5px 0 0; font-size: 11px; color: #ccc;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;

    const text = `
  ════════════════════════════════════════
          AMBER TOUCH
  ════════════════════════════════════════

  Email Verification

  Welcome to Amber Touch!

  Your verification code is:

  ════════════════════════════════════════
              ${code}
  ════════════════════════════════════════

  This code will expire in 10 minutes.

  If you didn't request this, please ignore this email.

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  ambertouch2026@gmail.com
  ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  `;

    try {
      const info = await transporter.sendMail({
        from: `"Amber Touch" <${process.env.SMTP_USER || 'ambertouch2026@gmail.com'}>`,
        to: email,
        subject: 'Verify Your Email - Amber Touch',
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
        success: false, 
        error: String(error) 
      });
    }

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      success: false,
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
