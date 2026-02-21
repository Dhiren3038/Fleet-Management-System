const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const vehicleValidation = [
  body('plateNumber').notEmpty().withMessage('Plate number required'),
  body('make').notEmpty().withMessage('Make required'),
  body('model').notEmpty().withMessage('Model required'),
  body('year').isInt({ min: 1990 }).withMessage('Valid year required'),
  body('type').isIn(['truck', 'van', 'pickup', 'sedan', 'motorcycle', 'bus']).withMessage('Invalid vehicle type'),
  body('capacityKg').isFloat({ min: 0 }).withMessage('Valid capacity required'),
  body('insuranceExpiry').isISO8601().withMessage('Valid insurance expiry date required'),
  body('registrationExpiry').isISO8601().withMessage('Valid registration expiry date required')
];

router.use(protect);

router.route('/')
  .get(ctrl.getVehicles)
  .post(authorize('manager', 'dispatcher'), vehicleValidation, validate, ctrl.createVehicle);

router.route('/:id')
  .get(ctrl.getVehicle)
  .put(authorize('manager'), ctrl.updateVehicle)
  .delete(authorize('manager'), ctrl.deleteVehicle);

router.patch('/:id/status', authorize('manager', 'dispatcher'), ctrl.updateVehicleStatus);

module.exports = router;
