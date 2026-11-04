const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
