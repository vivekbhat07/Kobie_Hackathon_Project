import crypto from 'crypto';
import { query } from '../db/pool.js';
import config from '../config/env.js';
import { sendOtpEmail } from './email.js';

function generateCode() {
  // 6-digit numeric code, zero-padded.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function issueOtp(email) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.otpTtlMinutes * 60 * 1000);

  // Invalidate any earlier unconsumed codes for this email.
  await query('UPDATE otps SET consumed = true WHERE email = $1 AND consumed = false', [email]);

  await query(
    'INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, $3)',
    [email, code, expiresAt]
  );

  await sendOtpEmail(email, code);
}

export async function verifyOtp(email, code) {
  const { rows } = await query(
    `SELECT id FROM otps
       WHERE email = $1 AND code = $2 AND consumed = false AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
    [email, code]
  );

  if (rows.length === 0) return false;

  await query('UPDATE otps SET consumed = true WHERE id = $1', [rows[0].id]);
  return true;
}
