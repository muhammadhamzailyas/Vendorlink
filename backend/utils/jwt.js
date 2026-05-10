const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!JWT_SECRET) {
  // We use a fallback for development if not provided, but warn loudly
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('WARNING: JWT_SECRET not provided. Using development fallback.');
}

const secret = JWT_SECRET || 'dev-secret-change-me-immediately';

/**
 * Sign a new access token for a user
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Sign a refresh token
 */
const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, secret, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 * Returns decoded payload or throws on failure
 */
const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = { signToken, signRefreshToken, verifyToken };
