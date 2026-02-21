const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'inspection', 'tyre', 'oil_change', 'brake', 'other'],
    required: true
  },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  mileageAtService: { type: Number, required: true, min: 0 },
  nextServiceMileage: { type: Number },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  vendor: { type: String, trim: true },
  cost: { type: Number, default: 0, min: 0 },
  partsReplaced: [{ name: String, cost: Number }],
  technicianName: { type: String, trim: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceNumber: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

maintenanceLogSchema.virtual('totalPartsCost').get(function () {
  return this.partsReplaced.reduce((sum, part) => sum + (part.cost || 0), 0);
});

maintenanceLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
