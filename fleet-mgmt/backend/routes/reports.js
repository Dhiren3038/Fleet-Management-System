const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', ctrl.getSummary);
router.get('/vehicle-costs', ctrl.getVehicleCosts);
router.get('/trip-analytics', ctrl.getTripAnalytics);
router.get('/compliance', ctrl.getCompliance);

module.exports = router;
