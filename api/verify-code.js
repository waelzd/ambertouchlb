// api/verify-code.js
import { supabase } from '../lib/supabase.js';

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

    // Get the latest unverified code for this email
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new code.' 
      });
    }

    const verificationRecord = data[0];

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(verificationRecord.expires_at);
    
    if (now > expiresAt) {
      // Mark as expired
      await supabase
        .from('verification_codes')
        .update({ verified: true })
        .eq('id', verificationRecord.id);
        
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check if too many attempts
    if (verificationRecord.attempts >= 5) {
      await supabase
        .from('verification_codes')
        .update({ verified: true })
        .eq('id', verificationRecord.id);
        
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify the code
    if (verificationRecord.code !== code) {
      // Increment attempts
      await supabase
        .from('verification_codes')
        .update({ attempts: verificationRecord.attempts + 1 })
        .eq('id', verificationRecord.id);
      
      const remainingAttempts = 5 - (verificationRecord.attempts + 1);
      return res.status(400).json({ 
        error: `Invalid verification code. ${remainingAttempts} attempts remaining.` 
      });
    }

    // Success - mark as verified
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verificationRecord.id);
    
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