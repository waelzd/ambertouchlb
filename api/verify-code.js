// api/verify-code.js
// This stores verification codes in memory (will reset on server restart)
const verificationStore = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, code } = body || {};

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    console.log('🔐 Verifying email:', email);
    console.log('Code provided:', code);

    // Get stored verification data
    const storedData = verificationStore[email];
    
    if (!storedData) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new code.' 
      });
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      // Remove expired code
      delete verificationStore[email];
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check if too many attempts
    if (storedData.attempts >= 5) {
      delete verificationStore[email];
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify the code
    if (storedData.code !== code) {
      storedData.attempts += 1;
      return res.status(400).json({ 
        error: `Invalid verification code. ${5 - storedData.attempts} attempts remaining.` 
      });
    }

    // Success - remove the code from store
    delete verificationStore[email];
    
    console.log('✅ Email verified successfully:', email);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}