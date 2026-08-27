// api/send-order-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { customerEmail, adminEmail, orderRef, shipping, itemsHtml, subtotal, shippingCost, total } = body || {};

    if (!customerEmail || !adminEmail || !shipping) {
      console.error('Missing required fields:', { customerEmail, adminEmail, shipping });
      return res.status(400).json({ error: 'Missing required fields', received: body });
    }

    console.log('📧 Sending emails for order:', orderRef);
    console.log('Customer email:', customerEmail);
    console.log('Admin email:', adminEmail);

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
    // CUSTOMER EMAIL - Order Confirmation
    // ============================================================
    const customerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 16px 0 12px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; color: #333; margin: 0; font-weight: 400;">Amber Touch</h1>
          <p style="font-size: 12px; color: #888; margin: 2px 0 0;">Order Confirmation</p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin: 0 0 4px;">Dear ${shipping.full_name},</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 20px;">Thank you for your order. Here are the details:</p>
        
        <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #888;">Order Reference</p>
          <p style="margin: 2px 0 0; font-size: 16px; font-weight: 600; color: #d4a574;">#${orderRef}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 0 0 12px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Product</th>
              <th style="text-align: center; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Qty</th>
              <th style="text-align: right; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin: 8px 0 16px;">
          <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #555;">
            <span>Subtotal :</span>
            <span>$${subtotal}</span>
          </p>
          <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #555;">
            <span>Shipping :</span>
            <span>$${shippingCost}</span>
          </p>
          <p style="display: flex; justify-content: space-between; margin: 6px 0 0; font-size: 16px; font-weight: 700; color: #d4a574; border-top: 2px solid #d4a574; padding-top: 8px;">
            <span>Total :</span>
            <span>$${total}</span>
          </p>
        </div>
        
        <p style="font-size: 12px; color: #888; margin: -8px 0 16px; text-align: right;">Payment: Cash on Delivery</p>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #888;">Shipping Address</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #333; line-height: 1.5;">
            ${shipping.full_name}<br>
            ${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}<br>
            ${shipping.city}${shipping.postal_code ? ', ' + shipping.postal_code : ''}, Lebanon<br>
            ${shipping.phone}
          </p>
        </div>
        
        <div style="background: #f7f7f7; padding: 12px 14px; border-radius: 4px; text-align: center; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #555;">We'll send you a tracking number once your order ships.</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Questions? <a href="mailto:ambertouch2026@gmail.com" style="color: #d4a574; text-decoration: none;">ambertouch2026@gmail.com</a></p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">Amber Touch • Luxury Fragrances</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #bbb;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;

    // ============================================================
    // ADMIN EMAIL - New Order Notification
    // ============================================================
    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px;">
        <div style="border-bottom: 2px solid #d4a574; padding: 12px 0 10px; margin-bottom: 16px;">
          <h1 style="font-size: 18px; color: #333; margin: 0; font-weight: 400;">New Order</h1>
          <p style="font-size: 13px; color: #888; margin: 2px 0 0;">#${orderRef} • $${total}</p>
        </div>
        
        <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px;">
          <span style="display: inline-block; background: #d4a574; color: #fff; padding: 2px 12px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase;">New Order</span>
          <span style="font-size: 12px; color: #888; margin-left: 10px;">${new Date().toLocaleString()}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 12px;">
          <div style="background: #f7f7f7; padding: 8px 12px; border-radius: 4px;">
            <p style="margin: 0; font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600;">Customer</p>
            <p style="margin: 2px 0 0; font-size: 14px; color: #333;">${shipping.full_name}</p>
          </div>
          <div style="background: #f7f7f7; padding: 8px 12px; border-radius: 4px;">
            <p style="margin: 0; font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600;">Email</p>
            <p style="margin: 2px 0 0; font-size: 14px; color: #333;"><a href="mailto:${customerEmail}" style="color: #d4a574; text-decoration: none;">${customerEmail}</a></p>
          </div>
          <div style="background: #f7f7f7; padding: 8px 12px; border-radius: 4px;">
            <p style="margin: 0; font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600;">Phone</p>
            <p style="margin: 2px 0 0; font-size: 14px; color: #333;">${shipping.phone}</p>
          </div>
          <div style="background: #f7f7f7; padding: 8px 12px; border-radius: 4px;">
            <p style="margin: 0; font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600;">Payment</p>
            <p style="margin: 2px 0 0; font-size: 14px; color: #333;">Cash on Delivery</p>
          </div>
        </div>
        
        <div style="background: #f7f7f7; padding: 10px 14px; border-radius: 4px; margin: 0 0 12px;">
          <p style="margin: 0; font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600;">Shipping Address</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #333; line-height: 1.5;">
            ${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}<br>
            ${shipping.city}${shipping.postal_code ? ', ' + shipping.postal_code : ''}, Lebanon
          </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 12px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Product</th>
              <th style="text-align: center; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Qty</th>
              <th style="text-align: right; padding: 6px 4px; border-bottom: 1px solid #ddd; color: #888; font-weight: 600; font-size: 11px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin: 8px 0 16px;">
          <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #555;">
            <span>Subtotal :</span>
            <span>$${subtotal}</span>
          </p>
          <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #555;">
            <span>Shipping :</span>
            <span>$${shippingCost}</span>
          </p>
          <p style="display: flex; justify-content: space-between; margin: 6px 0 0; font-size: 16px; font-weight: 700; color: #d4a574; border-top: 2px solid #d4a574; padding-top: 8px;">
            <span>Total :</span>
            <span>$${total}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin: 16px 0;">
          <a href="mailto:${customerEmail}" style="display: inline-block; background: #d4a574; color: #fff; padding: 8px 24px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">Reply to Customer</a>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 12px;">
          <p style="margin: 0; font-size: 11px; color: #aaa;">This order was placed through the Amber Touch website</p>
        </div>
      </div>
    `;

    // Plain text versions
    const customerText = `
  ════════════════════════════════════════
          AMBER TOUCH
  ════════════════════════════════════════

  Order Confirmation

  Dear ${shipping.full_name},

  Thank you for your order.

  Order Reference: #${orderRef}

  ────────────────────────────────────────
  ORDER SUMMARY
  ────────────────────────────────────────
  ${itemsHtml.replace(/<[^>]*>/g, '').trim()}

  Subtotal : $${subtotal}
  Shipping : $${shippingCost}
  ────────────────────────────────────────
  TOTAL : $${total}
  ────────────────────────────────────────

  Payment: Cash on Delivery

  Shipping Address:
  ${shipping.full_name}
  ${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}
  ${shipping.city}${shipping.postal_code ? ', ' + shipping.postal_code : ''}, Lebanon
  ${shipping.phone}

  We'll send you a tracking number once your order ships.

  Questions? ambertouch2026@gmail.com

  ════════════════════════════════════════
  Amber Touch • Luxury Fragrances
  ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  `;

    const adminText = `
  ════════════════════════════════════════
          NEW ORDER #${orderRef}
  ════════════════════════════════════════

  Customer: ${shipping.full_name}
  Email: ${customerEmail}
  Phone: ${shipping.phone}
  Payment: Cash on Delivery

  Shipping Address:
  ${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}
  ${shipping.city}${shipping.postal_code ? ', ' + shipping.postal_code : ''}, Lebanon

  ────────────────────────────────────────
  ORDER ITEMS
  ────────────────────────────────────────
  ${itemsHtml.replace(/<[^>]*>/g, '').trim()}

  Subtotal : $${subtotal}
  Shipping : $${shippingCost}
  ────────────────────────────────────────
  TOTAL : $${total}
  ════════════════════════════════════════
  `;

    // Send both emails
    const results = await Promise.all([
      sendEmail(customerEmail, `Order Confirmed #${orderRef}`, customerHtml, customerText),
      sendEmail(adminEmail, `New Order #${orderRef} — $${total}`, adminHtml, adminText),
    ]);

    const allOk = results.every(r => r.status === 200);

    return res.status(allOk ? 200 : 500).json({
      success: allOk,
      results,
      message: allOk ? 'Emails sent successfully' : 'Some emails failed to send'
    });

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}