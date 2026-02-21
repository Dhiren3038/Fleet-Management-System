# Fleet Management System — Fleet Management System

A production-grade MERN stack fleet management platform.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT
- **Frontend**: React (Vite), Tailwind CSS, Recharts

## Features
- Role-based access (Manager, Dispatcher, Safety Officer, Finance Analyst)
- Vehicle lifecycle management with state machine enforcement
- Driver roster with license compliance tracking
- Trip dispatch with real-time validation engine
- Maintenance scheduling with status transitions
- Fuel & expense logging with approval workflow
- Analytics dashboard with cost breakdowns and compliance alerts

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed   # Populate demo data
npm run dev    # Start dev server on :5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Start Vite dev server on :5173
```

### Environment Variables (backend/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fleet_mgmt
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@fleet.com | password123 |
| Dispatcher | dispatcher@fleet.com | password123 |
| Safety Officer | safety@fleet.com | password123 |
| Finance Analyst | finance@fleet.com | password123 |

## API Routes

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/vehicles
POST   /api/vehicles
PUT    /api/vehicles/:id
PATCH  /api/vehicles/:id/status
DELETE /api/vehicles/:id

GET    /api/drivers
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id

GET    /api/trips
POST   /api/trips           (dispatch)
PATCH  /api/trips/:id/start
PATCH  /api/trips/:id/complete
PATCH  /api/trips/:id/cancel
POST   /api/trips/validate  (pre-dispatch check)

GET    /api/maintenance
POST   /api/maintenance
PATCH  /api/maintenance/:id/start
PATCH  /api/maintenance/:id/complete

GET    /api/fuel
POST   /api/fuel

GET    /api/expenses
POST   /api/expenses
PATCH  /api/expenses/:id/approve

GET    /api/reports/summary
GET    /api/reports/vehicle-costs
GET    /api/reports/trip-analytics
GET    /api/reports/compliance
```

## Business Logic

### Trip Validation Engine
Before dispatch, the system verifies:
1. Vehicle is `available` (not on_trip or in_service)
2. Vehicle insurance & registration not expired
3. Cargo weight ≤ vehicle capacity
4. Driver is `available` (not on_trip, off_duty, or suspended)
5. Driver license not expired
6. No active trip already exists for vehicle/driver

### State Machine Transitions
- `Dispatch → in_progress`: vehicle + driver → `on_trip`
- `Complete`: vehicle + driver → `available`, mileage updated
- `Cancel`: vehicle + driver → `available` (if was in_progress)
- `Maintenance start`: vehicle → `in_service`
- `Maintenance complete`: vehicle → `available`

## Project Structure

```
fleet-mgmt/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Thin request handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── services/       # Business logic layer
│   └── utils/          # Seed script
└── frontend/
    └── src/
        ├── components/ # Reusable UI (common, layout)
        ├── context/    # Auth + Toast providers
        ├── layouts/    # App shell
        ├── pages/      # Route-level components
        └── services/   # Axios API client
```
