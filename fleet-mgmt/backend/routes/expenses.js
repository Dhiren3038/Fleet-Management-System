const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getExpenses)
  .post([
    body('category').isIn(['toll', 'parking', 'repair', 'fine', 'accommodation', 'meals', 'miscellaneous']).withMessage('Invalid category'),
    body('description').notEmpty().withMessage('Description required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required')
  ], validate, ctrl.createExpense);

router.patch('/:id/approve', authorize('manager', 'finance_analyst'), ctrl.approveExpense);
router.delete('/:id', authorize('manager'), ctrl.deleteExpense);

module.exports = router;
