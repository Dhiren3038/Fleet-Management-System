require('dotenv').config({ path: `.env` });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Vehicle.deleteMany(), Driver.deleteMany()]);
    console.log('Cleared existing data');

    // Create users
    const users = await User.create([
      { name: 'Admin Manager', email: 'manager@fleet.com', password: 'password123', role: 'manager' },
      { name: 'Jane Dispatcher', email: 'dispatcher@fleet.com', password: 'password123', role: 'dispatcher' },
      { name: 'Sam Safety', email: 'safety@fleet.com', password: 'password123', role: 'safety_officer' },
      { name: 'Frank Finance', email: 'finance@fleet.com', password: 'password123', role: 'finance_analyst' }
    ]);
    console.log('✅ Users seeded');

    // Create vehicles
    await Vehicle.create([
      {
        plateNumber: 'TRK-001', make: 'Volvo', model: 'FH16', year: 2021,
        type: 'truck', capacityKg: 20000, status: 'available', fuelType: 'diesel',
        currentMileage: 45000, insuranceExpiry: new Date('2026-06-01'),
        registrationExpiry: new Date('2026-03-01')
      },
      {
        plateNumber: 'VAN-002', make: 'Mercedes', model: 'Sprinter', year: 2022,
        type: 'van', capacityKg: 3500, status: 'available', fuelType: 'diesel',
        currentMileage: 22000, insuranceExpiry: new Date('2026-09-15'),
        registrationExpiry: new Date('2026-09-15')
      },
      {
        plateNumber: 'TRK-003', make: 'Scania', model: 'R450', year: 2020,
        type: 'truck', capacityKg: 18000, status: 'in_service', fuelType: 'diesel',
        currentMileage: 78000, insuranceExpiry: new Date('2025-12-01'),
        registrationExpiry: new Date('2026-01-01')
      },
      {
        plateNumber: 'PKP-004', make: 'Toyota', model: 'Hilux', year: 2023,
        type: 'pickup', capacityKg: 1000, status: 'available', fuelType: 'diesel',
        currentMileage: 8000, insuranceExpiry: new Date('2027-01-01'),
        registrationExpiry: new Date('2027-01-01')
      }
    ]);
    console.log('✅ Vehicles seeded');

    // Create drivers
    await Driver.create([
      {
        employeeId: 'EMP-001', name: 'James Anderson', email: 'james@fleet.com',
        phone: '+1-555-0101', licenseNumber: 'LIC-A001', licenseClass: 'A',
        licenseExpiry: new Date('2026-08-01'), status: 'available',
        dateOfBirth: new Date('1985-04-12'), hireDate: new Date('2019-01-15')
      },
      {
        employeeId: 'EMP-002', name: 'Maria Rodriguez', email: 'maria@fleet.com',
        phone: '+1-555-0102', licenseNumber: 'LIC-B002', licenseClass: 'B',
        licenseExpiry: new Date('2027-02-20'), status: 'available',
        dateOfBirth: new Date('1990-07-23'), hireDate: new Date('2021-03-10')
      },
      {
        employeeId: 'EMP-003', name: 'David Chen', email: 'david@fleet.com',
        phone: '+1-555-0103', licenseNumber: 'LIC-A003', licenseClass: 'A',
        licenseExpiry: new Date('2025-11-30'), status: 'off_duty',
        dateOfBirth: new Date('1988-11-05'), hireDate: new Date('2020-06-01')
      }
    ]);
    console.log('✅ Drivers seeded');

    console.log('\n🎉 Seed complete!');
    console.log('\nLogin credentials:');
    console.log('Manager:  manager@fleet.com / password123');
    console.log('Dispatcher: dispatcher@fleet.com / password123');
    console.log('Safety:   safety@fleet.com / password123');
    console.log('Finance:  finance@fleet.com / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
