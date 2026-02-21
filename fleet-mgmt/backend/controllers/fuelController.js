const FuelLog = require('../models/FuelLog');

exports.getLogs = async (req, res, next) => {
  try {
    const { vehicle, driver, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;

    const [logs, total] = await Promise.all([
      FuelLog.find(filter)
        .populate('vehicle', 'plateNumber make model')
        .populate('driver', 'name')
        .populate('loggedBy', 'name')
        .sort('-date').skip((page - 1) * limit).limit(parseInt(limit)),
      FuelLog.countDocuments(filter)
    ]);

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.createLog = async (req, res, next) => {
  try {
    const log = await FuelLog.create({ ...req.body, loggedBy: req.user._id });
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.updateLog = async (req, res, next) => {
  try {
    const log = await FuelLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found' });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.deleteLog = async (req, res, next) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found' });
    res.json({ success: true, message: 'Fuel log deleted' });
  } catch (err) { next(err); }
};
