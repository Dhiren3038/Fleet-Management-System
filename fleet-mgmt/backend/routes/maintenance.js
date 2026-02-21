const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getLogs)
  .post(authorize('manager', 'dispatcher', 'safety_officer'), [
    body('vehicleId').notEmpty().withMessage('Vehicle required'),
    body('type').isIn(['preventive', 'corrective', 'inspection', 'tyre', 'oil_change', 'brake', 'other']).withMessage('Valid type required'),
    body('description').notEmpty().withMessage('Description required'),
    body('mileageAtService').isFloat({ min: 0 }).withMessage('Valid mileage required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date required')
  ], validate, ctrl.createLog);

router.route('/:id')
  .get(ctrl.getLog)
  .put(authorize('manager', 'safety_officer'), ctrl.updateLog);

router.patch('/:id/start', authorize('manager', 'safety_officer'), ctrl.startMaintenance);
router.patch('/:id/complete', authorize('manager', 'safety_officer'), ctrl.completeMaintenance);

module.exports = router;
