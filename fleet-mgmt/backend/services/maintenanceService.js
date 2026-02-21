const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');

const scheduleMaintenace = async (data, userId) => {
  const vehicle = await Vehicle.findById(data.vehicleId);
  if (!vehicle) throw { statusCode: 404, message: 'Vehicle not found' };

  const log = await MaintenanceLog.create({ ...data, vehicle: data.vehicleId, loggedBy: userId });
  return log;
};

const startMaintenance = async (logId) => {
  const log = await MaintenanceLog.findById(logId);
  if (!log) throw { statusCode: 404, message: 'Maintenance log not found' };

  log.status = 'in_progress';
  await log.save();

  // STATE MACHINE: Vehicle goes into service
  await Vehicle.findByIdAndUpdate(log.vehicle, { status: 'in_service' });

  return log;
};

const completeMaintenance = async (logId, data) => {
  const log = await MaintenanceLog.findById(logId);
  if (!log) throw { statusCode: 404, message: 'Maintenance log not found' };
  if (log.status !== 'in_progress') throw { statusCode: 400, message: 'Maintenance must be in progress to complete' };

  Object.assign(log, { ...data, status: 'completed', completedDate: new Date() });
  await log.save();

  // STATE MACHINE: Vehicle returns to available
  const vehicleUpdate = { status: 'available' };
  if (log.nextServiceMileage) vehicleUpdate.nextServiceMileage = log.nextServiceMileage;
  await Vehicle.findByIdAndUpdate(log.vehicle, vehicleUpdate);

  return log;
};

module.exports = { scheduleMaintenace, startMaintenance, completeMaintenance };
