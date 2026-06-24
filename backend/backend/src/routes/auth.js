import { Router } from 'express';
import { query } from '../db/pool.js';
import config from '../config/env.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function domainAllowed(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain) && config.allowedDomains.includes(domain);
}

// POST /auth/send-otp
router.post('/send-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!domainAllowed(email)) {
    return res.status(403).json({
      error: `Email domain not allowed. Use one of: ${config.allowedDomains.join(', ')}.`,
    });
  }

  try {
    await issueOtp(email);
    return res.json({ message: 'Verification code sent.' });
  } catch (err) {
    console.error('send-otp failed:', err);
    return res.status(500).json({ error: 'Could not send the verification code.' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.otp || req.body?.code || '').trim();

  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Email and a 6-digit code are required.' });
  }
  if (!domainAllowed(email)) {
    return res.status(403).json({ error: 'Email domain not allowed.' });
  }

  try {
    const ok = await verifyOtp(email, code);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid or expired code.' });
    }

    // Upsert the user record.
    const { rows } = await query(
      `INSERT INTO users (email, last_login)
         VALUES ($1, now())
       ON CONFLICT (email)
         DO UPDATE SET last_login = now()
       RETURNING id, email`,
      [email]
    );
    const user = rows[0];

    const token = signToken({ sub: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('verify-otp failed:', err);
    return res.status(500).json({ error: 'Could not verify the code.' });
  }
});

export default router;
