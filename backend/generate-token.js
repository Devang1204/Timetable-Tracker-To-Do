require('dotenv').config();
const jwt = require('jsonwebtoken');

const user = {
  id: 4,
  role: 'student'
};

const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
console.log("Generated Token:", token);
