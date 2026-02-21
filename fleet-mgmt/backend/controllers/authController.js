const { loginUser, registerUser } = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
  try {
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ success: true, token, user });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await require('../models/User').findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
