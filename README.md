# TrustPaws

Pet spa transparency app for Heads Up For Tails. Gives pet parents real-time visibility into their pet's grooming appointment.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your PostgreSQL credentials
```

### 4. Setup database
```bash
npm run db:setup
```
This runs migrations and seeds demo data:
- **Admin:** admin@huft.com / admin123
- **Staff:** groomer@huft.com / staff123

### 5. Run the app
```bash
npm run dev
```
- Staff portal: http://localhost:5173
- API: http://localhost:3001

## Features

### Staff Portal
- Dashboard with today's appointments at a glance
- Create appointments with service checklists
- Step-by-step status updates (Checked In → Bathing → Grooming → Drying → Ready → Completed)
- Upload before/after/during photos
- Log incidents with severity levels and actions taken
- Manage pets and pet parents

### Pet Parent Tracking Page
- Shareable link (no login required)
- Real-time status with visual timeline
- Service completion checklist
- Incident reports shown transparently
- Before/after photos
- Auto-refreshes every 30 seconds

## Project Structure
```
trustpaws/
├── client/          # React + Vite + Tailwind frontend
└── server/          # Node.js + Express + Prisma backend
    └── prisma/      # Database schema & migrations
```
