const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  date: { type: Date, required: true, default: Date.now },
  liters: { type: Number, required: true, min: 0.1 },
  pricePerLiter: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  mileageAtFueling: { type: Number, required: true, min: 0 },
  fuelStation: { type: String, trim: true },
  receiptNumber: { type: String, trim: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

// Auto-calculate totalCost before save
fuelLogSchema.pre('save', function (next) {
  if (this.liters && this.pricePerLiter) {
    this.totalCost = parseFloat((this.liters * this.pricePerLiter).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('FuelLog', fuelLogSchema);
