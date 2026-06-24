import nodemailer from 'nodemailer';
import config from '../config/env.js';

let transporter = null;

if (config.smtp.host) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth:
      config.smtp.user || config.smtp.pass
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
  });
}

export async function sendOtpEmail(email, code) {
  const subject = 'Your Alert Portal verification code';
  const text = `Your verification code is ${code}. It expires in ${config.otpTtlMinutes} minutes.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a1a1a">
      <p>Your Alert Portal verification code is:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
      <p style="color:#666">This code expires in ${config.otpTtlMinutes} minutes.</p>
    </div>`;

  if (!transporter) {
    // Dev fallback: no SMTP configured, so print the code to the server log.
    console.log(`\n[OTP] Code for ${email}: ${code} (expires in ${config.otpTtlMinutes}m)\n`);
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject,
    text,
    html,
  });
}
