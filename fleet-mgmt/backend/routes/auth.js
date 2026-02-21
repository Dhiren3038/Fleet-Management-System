const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], validate, authController.login);

router.post('/register', [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['manager', 'dispatcher', 'safety_officer', 'finance_analyst']).withMessage('Invalid role')
], validate, authController.register);

router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateProfile);

module.exports = router;
