const Vehicle = require('../models/Vehicle');

exports.getVehicles = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).populate('assignedDriver', 'name employeeId').sort('-createdAt')
        .skip((page - 1) * limit).limit(parseInt(limit)),
      Vehicle.countDocuments(filter)
    ]);

    res.json({ success: true, data: vehicles, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('assignedDriver', 'name employeeId phone');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    // Prevent manual status changes that bypass state machine
    const protectedFields = ['status'];
    protectedFields.forEach(f => delete req.body[f]);

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (vehicle.status === 'on_trip') return res.status(400).json({ success: false, message: 'Cannot delete vehicle currently on a trip' });
    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { next(err); }
};
