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


