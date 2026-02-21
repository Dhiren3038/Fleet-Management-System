const Driver = require('../models/Driver');

exports.getDrivers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [drivers, total] = await Promise.all([
      Driver.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
      Driver.countDocuments(filter)
    ]);

    res.json({ success: true, data: drivers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const protectedFields = ['status', 'totalTrips', 'totalDistanceKm'];
    protectedFields.forEach(f => delete req.body[f]);

    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.updateDriverStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    if (driver.status === 'on_trip') return res.status(400).json({ success: false, message: 'Cannot delete driver currently on a trip' });
    await driver.deleteOne();
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) { next(err); }
};
