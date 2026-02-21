const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: { type: String, required: true, unique: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number }
  },
  destination: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number }
  },
  cargoDescription: { type: String, required: true },
  cargoWeightKg: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDeparture: { type: Date, required: true },
  scheduledArrival: { type: Date, required: true },
  actualDeparture: { type: Date },
  actualArrival: { type: Date },
  startMileage: { type: Number },
  endMileage: { type: Number },
  distanceKm: { type: Number },
  notes: { type: String, trim: true },
  cancellationReason: { type: String, trim: true }
}, { timestamps: true });

tripSchema.virtual('durationHours').get(function () {
  if (this.actualDeparture && this.actualArrival) {
    return ((this.actualArrival - this.actualDeparture) / 3600000).toFixed(2);
  }
  return null;
});

// Auto-generate trip number
tripSchema.pre('validate', async function (next) {
  if (!this.tripNumber) {
    const count = await this.constructor.countDocuments();
    this.tripNumber = `TRP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

tripSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
