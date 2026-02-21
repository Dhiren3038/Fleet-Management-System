const MaintenanceLog = require('../models/MaintenanceLog');
const maintenanceService = require('../services/maintenanceService');

exports.getLogs = async (req, res, next) => {
  try {
    const { vehicle, status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [logs, total] = await Promise.all([
      MaintenanceLog.find(filter)
        .populate('vehicle', 'plateNumber make model')
        .populate('loggedBy', 'name')
        .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
      MaintenanceLog.countDocuments(filter)
    ]);

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('vehicle', 'plateNumber make model currentMileage')
      .populate('loggedBy', 'name');
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.createLog = async (req, res, next) => {
  try {
    const log = await maintenanceService.scheduleMaintenace(req.body, req.user._id);
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.updateLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.startMaintenance = async (req, res, next) => {
  try {
    const log = await maintenanceService.startMaintenance(req.params.id);
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.completeMaintenance = async (req, res, next) => {
  try {
    const log = await maintenanceService.completeMaintenance(req.params.id, req.body);
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};
