const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

/**
 * TRIP VALIDATION ENGINE
 * Enforces all business rules before dispatch
 */
const validateDispatch = async (vehicleId, driverId, cargoWeightKg) => {
  const errors = [];

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) errors.push('Vehicle not found');
  else {
    if (vehicle.status !== 'available') errors.push(`Vehicle is currently ${vehicle.status.replace('_', ' ')}`);
    if (cargoWeightKg > vehicle.capacityKg) errors.push(`Cargo weight (${cargoWeightKg}kg) exceeds vehicle capacity (${vehicle.capacityKg}kg)`);
    if (!vehicle.isInsuranceValid) errors.push('Vehicle insurance has expired');
    if (!vehicle.isRegistrationValid) errors.push('Vehicle registration has expired');
  }

  const driver = await Driver.findById(driverId);
  if (!driver) errors.push('Driver not found');
  else {
    if (driver.status !== 'available') errors.push(`Driver is currently ${driver.status.replace('_', ' ')}`);
    if (!driver.isLicenseValid) errors.push('Driver license has expired');
  }

  // Check for concurrent active trips
  const activeTrip = await Trip.findOne({
    $or: [{ vehicle: vehicleId }, { driver: driverId }],
    status: 'in_progress'
  });
  if (activeTrip) errors.push('Vehicle or driver already has an active trip');

  return { valid: errors.length === 0, errors };
};

const dispatchTrip = async (tripData, userId) => {
  const { vehicleId, driverId, cargoWeightKg } = tripData;

  const { valid, errors } = await validateDispatch(vehicleId, driverId, cargoWeightKg);
  if (!valid) throw { statusCode: 400, message: errors.join(' | '), errors };

  const trip = await Trip.create({
    ...tripData,
    vehicle: vehicleId,
    driver: driverId,
    dispatchedBy: userId,
    status: 'scheduled'
  });

  return trip;
};

const startTrip = async (tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw { statusCode: 404, message: 'Trip not found' };
  if (trip.status !== 'scheduled') throw { statusCode: 400, message: 'Only scheduled trips can be started' };

  trip.status = 'in_progress';
  trip.actualDeparture = new Date();
  await trip.save();

  // STATE MACHINE: Update vehicle and driver
  await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'on_trip' });
  await Driver.findByIdAndUpdate(trip.driver, { status: 'on_trip' });

  return trip;
};

const completeTrip = async (tripId, { endMileage, notes }) => {
  const trip = await Trip.findById(tripId).populate('vehicle driver');
  if (!trip) throw { statusCode: 404, message: 'Trip not found' };
  if (trip.status !== 'in_progress') throw { statusCode: 400, message: 'Only in-progress trips can be completed' };

  const distanceKm = endMileage && trip.startMileage ? endMileage - trip.startMileage : null;

  trip.status = 'completed';
  trip.actualArrival = new Date();
  trip.endMileage = endMileage;
  if (distanceKm) trip.distanceKm = distanceKm;
  if (notes) trip.notes = notes;
  await trip.save();

  // STATE MACHINE: Restore vehicle and driver to available
  await Vehicle.findByIdAndUpdate(trip.vehicle._id, {
    status: 'available',
    currentMileage: endMileage || trip.vehicle.currentMileage
  });

  const driverUpdate = { status: 'available', $inc: { totalTrips: 1 } };
  if (distanceKm) driverUpdate.$inc.totalDistanceKm = distanceKm;
  await Driver.findByIdAndUpdate(trip.driver._id, driverUpdate);

  return trip;
};

const cancelTrip = async (tripId, reason) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw { statusCode: 404, message: 'Trip not found' };
  if (!['scheduled', 'in_progress'].includes(trip.status)) {
    throw { statusCode: 400, message: 'Trip cannot be cancelled in its current state' };
  }

  const wasInProgress = trip.status === 'in_progress';
  trip.status = 'cancelled';
  trip.cancellationReason = reason;
  await trip.save();

  if (wasInProgress) {
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'available' });
    await Driver.findByIdAndUpdate(trip.driver, { status: 'available' });
  }

  return trip;
};

module.exports = { validateDispatch, dispatchTrip, startTrip, completeTrip, cancelTrip };
