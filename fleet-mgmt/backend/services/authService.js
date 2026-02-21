const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);
  return { user, token };
};

const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }
  const user = await User.create(data);
  const token = generateToken(user._id);
  return { user, token };
};

module.exports = { loginUser, registerUser, generateToken };
