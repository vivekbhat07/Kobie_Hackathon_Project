import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
