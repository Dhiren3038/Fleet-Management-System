const Trip = require('../models/Trip');
const tripService = require('../services/tripService');

exports.getTrips = async (req, res, next) => {
  try {
    const { status, vehicle, driver, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('vehicle', 'plateNumber make model capacityKg')
        .populate('driver', 'name employeeId phone')
        .populate('dispatchedBy', 'name role')
        .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
      Trip.countDocuments(filter)
    ]);

    res.json({ success: true, data: trips, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle', 'plateNumber make model type capacityKg fuelType')
      .populate('driver', 'name employeeId phone licenseClass')
      .populate('dispatchedBy', 'name role');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
};

exports.createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.dispatchTrip(req.body, req.user._id);
    const populated = await trip.populate([
      { path: 'vehicle', select: 'plateNumber make model' },
      { path: 'driver', select: 'name employeeId' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.startTrip = async (req, res, next) => {
  try {
    const { startMileage } = req.body;
    const trip = await tripService.startTrip(req.params.id, startMileage);
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
};

exports.completeTrip = async (req, res, next) => {
  try {
    const trip = await tripService.completeTrip(req.params.id, req.body);
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
};

exports.cancelTrip = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const trip = await tripService.cancelTrip(req.params.id, reason);
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
};

exports.validateDispatch = async (req, res, next) => {
  try {
    const { vehicleId, driverId, cargoWeightKg } = req.body;
    const result = await tripService.validateDispatch(vehicleId, driverId, cargoWeightKg);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};
