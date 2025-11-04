const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1hr"; // example, customize as needed

function generateUserToken(email, role, userId) {
  // use 'userId' instead of '_id'
  return jwt.sign({ email, role, userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyUserToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { generateUserToken, verifyUserToken };
