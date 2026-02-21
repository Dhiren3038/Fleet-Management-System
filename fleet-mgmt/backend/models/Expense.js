const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  category: {
    type: String,
    enum: ['toll', 'parking', 'repair', 'fine', 'accommodation', 'meals', 'miscellaneous'],
    required: true
  },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  receiptNumber: { type: String, trim: true },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
