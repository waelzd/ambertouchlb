import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body || '{}');

    console.log('📧 Sending contact form email from:', email);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log('Admin email from env:', JSON.stringify(adminEmail)); // shows quotes/spaces if any

    const sendEmail = async (to: string, emailSubject: string, html: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject: emailSubject, html }),
      });
      const data = await res.json();
      console.log(`Email to ${to} → status: ${res.status}`, JSON.stringify(data));
      return { status: res.status, data };
    };

    const adminHtml = `
      <h2>New Contact Message Form Customer</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || '(none)'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    const result = await sendEmail(
      adminEmail!,
      `New Contact: ${subject || 'No subject'}`,
      adminHtml
    );

    return {
      statusCode: result.status === 200 ? 200 : 500,
      body: JSON.stringify({ success: result.status === 200, result }),
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

export { handler };