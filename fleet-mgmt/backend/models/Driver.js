const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true, trim: true },
  licenseClass: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true },
  licenseExpiry: { type: Date, required: true },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'off_duty', 'suspended'],
    default: 'available'
  },
  dateOfBirth: { type: Date, required: true },
  hireDate: { type: Date, required: true },
  address: { type: String, trim: true },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true }
  },
  totalTrips: { type: Number, default: 0 },
  totalDistanceKm: { type: Number, default: 0 },
  notes: { type: String, trim: true }
}, { timestamps: true });

driverSchema.virtual('isLicenseValid').get(function () {
  return this.licenseExpiry > new Date();
});

driverSchema.virtual('age').get(function () {
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
