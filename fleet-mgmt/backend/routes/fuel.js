const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/fuelController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getLogs)
  .post(authorize('manager', 'dispatcher', 'finance_analyst'), [
    body('vehicle').notEmpty().withMessage('Vehicle required'),
    body('liters').isFloat({ min: 0.1 }).withMessage('Valid liters required'),
    body('pricePerLiter').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('mileageAtFueling').isFloat({ min: 0 }).withMessage('Valid mileage required')
  ], validate, ctrl.createLog);

router.route('/:id')
  .put(authorize('manager', 'finance_analyst'), ctrl.updateLog)
  .delete(authorize('manager'), ctrl.deleteLog);

module.exports = router;
