const reportService = require('../services/reportService');

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await reportService.getOperationalSummary();
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};

exports.getVehicleCosts = async (req, res, next) => {
  try {
    const data = await reportService.getVehicleCostReport();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getTripAnalytics = async (req, res, next) => {
  try {
    const data = await reportService.getTripAnalytics();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getCompliance = async (req, res, next) => {
  try {
    const data = await reportService.getComplianceReport();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
