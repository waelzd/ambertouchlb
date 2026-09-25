// api/send-contact-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    // Create transporter with your Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'ambertouch2026@gmail.com',
        pass: process.env.SMTP_PASS || 'ohlk dzqx nfdz mpeu',
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: `"Amber Touch" <${process.env.SMTP_USER || 'ambertouch2026@gmail.com'}>`,
      to: process.env.CONTACT_EMAIL || 'ambertouch2026@gmail.com',
      replyTo: email,
      subject: subject || 'New Contact Form Submission - Amber Touch',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
          <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px;">
            <h1 style="font-size: 20px; color: #333; margin: 0; font-weight: 400;">Amber Touch</h1>
            <p style="font-size: 12px; color: #888; margin: 2px 0 0;">New Contact Form Message</p>
          </div>
          
          <p style="font-size: 14px; color: #555; margin: 0 0 4px;">Someone has reached out through your website:</p>
          
          <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #888;">Name</p>
            <p style="margin: 2px 0 0; font-size: 15px; color: #333;">${name}</p>
          </div>
          
          <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin: 12px 0;">
            <p style="margin: 0; font-size: 12px; color: #888;">Email</p>
            <p style="margin: 2px 0 0; font-size: 15px; color: #333;"><a href="mailto:${email}" style="color: #d4a574; text-decoration: none;">${email}</a></p>
          </div>
          
          ${subject ? `
            <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin: 12px 0;">
              <p style="margin: 0; font-size: 12px; color: #888;">Subject</p>
              <p style="margin: 2px 0 0; font-size: 15px; color: #333;">${subject}</p>
            </div>
          ` : ''}
          
          <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; margin: 12px 0;">
            <p style="margin: 0; font-size: 12px; color: #888;">Message</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0 16px;">
            <a href="mailto:${email}?subject=Re: ${subject || 'Your inquiry about Amber Touch'}" 
               style="display: inline-block; background: #d4a574; color: #fff; padding: 8px 24px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">
              📨 Reply to ${name}
            </a>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px;">
            <p style="margin: 0; font-size: 11px; color: #aaa;">This message was sent from the Amber Touch contact form</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #bbb;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      `,
      text: `
        ════════════════════════════════════════
              AMBER TOUCH
        ════════════════════════════════════════

        📨 NEW CONTACT FORM MESSAGE

        ────────────────────────────────────────
        Name: ${name}
        Email: ${email}
        ${subject ? `Subject: ${subject}` : ''}

        Message:
        ${message}
        ────────────────────────────────────────

        Reply to: ${email}

        ════════════════════════════════════════
        This message was sent from the Amber Touch
        contact form on ${new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
        ════════════════════════════════════════
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return res.status(200).json({ 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Email error details:', error);
    return res.status(500).json({ 
      error: 'Failed to send email. Please contact us directly.',
      details: error.message 
    });
  }
}