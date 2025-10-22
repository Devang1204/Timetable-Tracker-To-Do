// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // 1. Get the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  // 2. Check if a token was provided
  if (token == null) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // 3. Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // If the token is invalid or expired
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }

    // 4. Attach the user's info to the request object
    req.user = user; // The user object contains the id and role we signed into the token

    // 5. Proceed to the next step (the actual route)
    next();
  });
}

module.exports = authMiddleware;