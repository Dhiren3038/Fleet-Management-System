const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const MaintenanceLog = require('../models/MaintenanceLog');

const getOperationalSummary = async () => {
  const [
    totalVehicles, availableVehicles, onTripVehicles, inServiceVehicles,
    totalDrivers, availableDrivers, onTripDrivers,
    totalTrips, completedTrips, inProgressTrips,
    fuelAgg, expenseAgg, maintenanceAgg
  ] = await Promise.all([
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: 'available' }),
    Vehicle.countDocuments({ status: 'on_trip' }),
    Vehicle.countDocuments({ status: 'in_service' }),
    Driver.countDocuments(),
    Driver.countDocuments({ status: 'available' }),
    Driver.countDocuments({ status: 'on_trip' }),
    Trip.countDocuments(),
    Trip.countDocuments({ status: 'completed' }),
    Trip.countDocuments({ status: 'in_progress' }),
    FuelLog.aggregate([{ $group: { _id: null, total: { $sum: '$totalCost' }, totalLiters: { $sum: '$liters' } } }]),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    MaintenanceLog.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }])
  ]);

  const totalFuelCost = fuelAgg[0]?.total || 0;
  const totalLiters = fuelAgg[0]?.totalLiters || 0;
  const totalExpenses = expenseAgg[0]?.total || 0;
  const totalMaintenance = maintenanceAgg[0]?.total || 0;
  const totalOperationalCost = totalFuelCost + totalExpenses + totalMaintenance;

  return {
    fleet: { total: totalVehicles, available: availableVehicles, onTrip: onTripVehicles, inService: inServiceVehicles },
    drivers: { total: totalDrivers, available: availableDrivers, onTrip: onTripDrivers },
    trips: { total: totalTrips, completed: completedTrips, inProgress: inProgressTrips },
    financials: { totalFuelCost, totalLiters, totalExpenses, totalMaintenance, totalOperationalCost }
  };
};

const getVehicleCostReport = async () => {
  const [fuelByVehicle, maintenanceByVehicle, expenseByVehicle] = await Promise.all([
    FuelLog.aggregate([{ $group: { _id: '$vehicle', fuel: { $sum: '$totalCost' }, liters: { $sum: '$liters' } } }]),
    MaintenanceLog.aggregate([{ $group: { _id: '$vehicle', maintenance: { $sum: '$cost' } } }]),
    Expense.aggregate([{ $group: { _id: '$vehicle', expenses: { $sum: '$amount' } } }])
  ]);

  const costMap = {};
  fuelByVehicle.forEach(r => { costMap[r._id] = { ...costMap[r._id], fuel: r.fuel, liters: r.liters }; });
  maintenanceByVehicle.forEach(r => { costMap[r._id] = { ...costMap[r._id], maintenance: r.maintenance }; });
  expenseByVehicle.forEach(r => { costMap[r._id] = { ...costMap[r._id], expenses: r.expenses }; });

  const vehicles = await Vehicle.find({ _id: { $in: Object.keys(costMap) } }).select('plateNumber make model');
  return vehicles.map(v => {
    const costs = costMap[v._id.toString()] || {};
    return {
      vehicle: v,
      fuel: costs.fuel || 0,
      liters: costs.liters || 0,
      maintenance: costs.maintenance || 0,
      expenses: costs.expenses || 0,
      total: (costs.fuel || 0) + (costs.maintenance || 0) + (costs.expenses || 0)
    };
  }).sort((a, b) => b.total - a.total);
};

const getTripAnalytics = async () => {
  const [monthlyTrips, tripsByStatus, recentTrips] = await Promise.all([
    Trip.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]),
    Trip.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Trip.find().sort('-createdAt').limit(10)
      .populate('vehicle', 'plateNumber make model')
      .populate('driver', 'name')
      .populate('dispatchedBy', 'name')
  ]);

  return { monthlyTrips, tripsByStatus, recentTrips };
};

const getComplianceReport = async () => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expiredInsurance, expiringInsurance, expiredRegistration, expiringRegistration, expiredLicenses, expiringLicenses] = await Promise.all([
    Vehicle.find({ insuranceExpiry: { $lt: now } }).select('plateNumber make model insuranceExpiry'),
    Vehicle.find({ insuranceExpiry: { $gte: now, $lte: thirtyDaysFromNow } }).select('plateNumber make model insuranceExpiry'),
    Vehicle.find({ registrationExpiry: { $lt: now } }).select('plateNumber make model registrationExpiry'),
    Vehicle.find({ registrationExpiry: { $gte: now, $lte: thirtyDaysFromNow } }).select('plateNumber make model registrationExpiry'),
    Driver.find({ licenseExpiry: { $lt: now } }).select('name employeeId licenseExpiry'),
    Driver.find({ licenseExpiry: { $gte: now, $lte: thirtyDaysFromNow } }).select('name employeeId licenseExpiry')
  ]);

  return { expiredInsurance, expiringInsurance, expiredRegistration, expiringRegistration, expiredLicenses, expiringLicenses };
};

module.exports = { getOperationalSummary, getVehicleCostReport, getTripAnalytics, getComplianceReport };
