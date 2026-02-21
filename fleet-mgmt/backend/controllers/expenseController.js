const Expense = require('../models/Expense');

exports.getExpenses = async (req, res, next) => {
  try {
    const { vehicle, driver, category, approvalStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;
    if (category) filter.category = category;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('vehicle', 'plateNumber make model')
        .populate('driver', 'name')
        .populate('loggedBy', 'name')
        .populate('approvedBy', 'name')
        .sort('-date').skip((page - 1) * limit).limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    res.json({ success: true, data: expenses, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, loggedBy: req.user._id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
};

exports.approveExpense = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
};
