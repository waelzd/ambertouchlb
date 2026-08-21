import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { customerEmail, adminEmail, orderRef, shipping, itemsHtml, subtotal, shippingCost, total } = JSON.parse(event.body || '{}');

    console.log('📧 Sending emails for order:', orderRef);
    console.log('Customer email:', customerEmail);
    console.log('Admin email:', adminEmail);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

    const sendEmail = async (to: string, subject: string, html: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html }),
      });
      const data = await res.json();
      console.log(`Email to ${to} → status: ${res.status}`, JSON.stringify(data));
      return { status: res.status, data };
    };

    const adminHtml = `
      <h2>New Order #${orderRef}</h2>
      <p><strong>Customer:</strong> ${shipping.full_name}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${shipping.phone}</p>
      <p><strong>Shipping Address:</strong><br/>
        ${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}<br/>
        ${shipping.city}${shipping.postal_code ? ', ' + shipping.postal_code : ''}, Lebanon
      </p>
      <h3>Items</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd">Product</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #ddd">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin-top:16px"><strong>Subtotal:</strong> $${subtotal}</p>
      <p><strong>Shipping:</strong> $${shippingCost}</p>
      <p><strong>Total:</strong> $${total}</p>
      <p><strong>Payment:</strong> Cash on Delivery</p>
    `;

   const results = await Promise.all([
  sendEmail(customerEmail, `Order Confirmed #${orderRef}`, `<p>Thank you for your order!</p>`),
  sendEmail(adminEmail, `New Order #${orderRef} — $${total}`, adminHtml),
]);

    const allOk = results.every(r => r.status === 200);

    return {
      statusCode: allOk ? 200 : 500,
      body: JSON.stringify({ success: allOk, results }),
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

export { handler };