const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getDrivers)
  .post(authorize('manager', 'dispatcher'), [
    body('employeeId').notEmpty().withMessage('Employee ID required'),
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').notEmpty().withMessage('Phone required'),
    body('licenseNumber').notEmpty().withMessage('License number required'),
    body('licenseClass').isIn(['A', 'B', 'C', 'D', 'E']).withMessage('Valid license class required'),
    body('licenseExpiry').isISO8601().withMessage('Valid license expiry required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    body('hireDate').isISO8601().withMessage('Valid hire date required')
  ], validate, ctrl.createDriver);

router.route('/:id')
  .get(ctrl.getDriver)
  .put(authorize('manager'), ctrl.updateDriver)
  .delete(authorize('manager'), ctrl.deleteDriver);

router.patch('/:id/status', authorize('manager', 'dispatcher'), ctrl.updateDriverStatus);

module.exports = router;
