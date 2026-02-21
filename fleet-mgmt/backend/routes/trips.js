const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.post('/validate', ctrl.validateDispatch);

router.route('/')
  .get(ctrl.getTrips)
  .post(authorize('manager', 'dispatcher'), [
    body('vehicleId').notEmpty().withMessage('Vehicle required'),
    body('driverId').notEmpty().withMessage('Driver required'),
    body('origin.address').notEmpty().withMessage('Origin address required'),
    body('destination.address').notEmpty().withMessage('Destination address required'),
    body('cargoDescription').notEmpty().withMessage('Cargo description required'),
    body('cargoWeightKg').isFloat({ min: 0 }).withMessage('Valid cargo weight required'),
    body('scheduledDeparture').isISO8601().withMessage('Valid scheduled departure required'),
    body('scheduledArrival').isISO8601().withMessage('Valid scheduled arrival required')
  ], validate, ctrl.createTrip);

router.route('/:id').get(ctrl.getTrip);
router.patch('/:id/start', authorize('manager', 'dispatcher'), ctrl.startTrip);
router.patch('/:id/complete', authorize('manager', 'dispatcher'), ctrl.completeTrip);
router.patch('/:id/cancel', authorize('manager', 'dispatcher'), ctrl.cancelTrip);

module.exports = router;
