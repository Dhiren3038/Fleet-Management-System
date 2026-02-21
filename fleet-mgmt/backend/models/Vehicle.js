const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() + 1 },
  type: {
    type: String,
    enum: ['truck', 'van', 'pickup', 'sedan', 'motorcycle', 'bus'],
    required: true
  },
  capacityKg: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'in_service', 'retired'],
    default: 'available'
  },
  fuelType: { type: String, enum: ['diesel', 'petrol', 'electric', 'hybrid'], default: 'diesel' },
  currentMileage: { type: Number, default: 0, min: 0 },
  nextServiceMileage: { type: Number },
  insuranceExpiry: { type: Date, required: true },
  registrationExpiry: { type: Date, required: true },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  notes: { type: String, trim: true }
}, { timestamps: true });

vehicleSchema.virtual('isInsuranceValid').get(function () {
  return this.insuranceExpiry > new Date();
});

vehicleSchema.virtual('isRegistrationValid').get(function () {
  return this.registrationExpiry > new Date();
});

vehicleSchema.virtual('isCompliant').get(function () {
  return this.isInsuranceValid && this.isRegistrationValid;
});

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
