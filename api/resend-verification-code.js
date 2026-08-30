// api/resend-verification-code.js
import nodemailer from 'nodemailer';
import { supabase } from '../lib/supabase.js';

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
    const { email, fullName } = body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📧 Resending verification email to:', email);

    // Check if there's already an unverified code for this email
    const { data: existingCodes, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    let verificationCode;
    let expiresAt;
    
    if (existingCodes && existingCodes.length > 0) {
      const existing = existingCodes[0];
      const now = new Date();
      const existingExpiresAt = new Date(existing.expires_at);
      
      if (now < existingExpiresAt) {
        // Reuse the existing code if it's still valid
        verificationCode = existing.code;
        expiresAt = existingExpiresAt;
        console.log('✅ Reusing existing valid code:', verificationCode);
      } else {
        // Generate new code
        verificationCode = generateVerificationCode();
        expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // Delete old expired codes
        await supabase
          .from('verification_codes')
          .delete()
          .eq('email', email)
          .eq('verified', false);
        
        // Insert new code
        await supabase
          .from('verification_codes')
          .insert([
            { 
              email, 
              code: verificationCode, 
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString()
            }
          ]);
        console.log('✅ Generated new code:', verificationCode);
      }
    } else {
      // Generate new code
      verificationCode = generateVerificationCode();
      expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await supabase
        .from('verification_codes')
        .insert([
          { 
            email, 
            code: verificationCode, 
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          }
        ]);
      console.log('✅ Generated new code:', verificationCode);
    }

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'ambertouch2026@gmail.com',
        pass: process.env.SMTP_PASS || 'ohlk dzqx nfdz mpeu',
      },
    });

    await transporter.verify();

    // HTML email template
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; color: #333; margin: 0; font-weight: 400;">Amber Touch</h1>
          <p style="font-size: 12px; color: #888; margin: 2px 0 0;">New Verification Code</p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin: 0 0 4px;">Dear ${fullName || 'Customer'},</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 20px;">Here is your new verification code for Amber Touch:</p>
        
        <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #d4a574;">
          <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
          <p style="margin: 8px 0 0; font-size: 42px; font-weight: 700; color: #d4a574; letter-spacing: 8px; font-family: monospace;">${verificationCode}</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #999;">This code expires in 10 minutes</p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">Amber Touch • Luxury Fragrances</p>
        </div>
      </div>
    `;

    const text = `
  ════════════════════════════════════════
          AMBER TOUCH
  ════════════════════════════════════════

  New Verification Code

  Dear ${fullName || 'Customer'},

  Here is your new verification code:

  ────────────────────────────────────────
        VERIFICATION CODE
    ${verificationCode}
  ────────────────────────────────────────
  
  This code expires in 10 minutes.

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  `;

    try {
      const info = await transporter.sendMail({
        from: `"Amber Touch" <${process.env.SMTP_USER || 'ambertouch2026@gmail.com'}>`,
        to: email,
        subject: 'New Verification Code - Amber Touch',
        html: html,
        text: text,
      });
      
      console.log('✅ Resent verification email:', info.messageId);
      
      return res.status(200).json({
        success: true,
        message: 'Verification code resent successfully',
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