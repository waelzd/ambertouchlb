// api/send-reset-password/route.js
import { sendResetPasswordEmail } from '../send-reset-password-email.js';

export async function POST(request) {
  try {
    const { email, resetLink } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send the reset password email using your existing function
    const result = await sendResetPasswordEmail(email, resetLink);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        messageId: result.messageId 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in reset-password route:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send reset password email. Please try again.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}