# TrustPaws — Setup & Technical Reference

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Deployment](#deployment)
- [Demo Credentials](#demo-credentials)
- [Feature Reference](#feature-reference)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI framework |
| Styling | Tailwind CSS | Utility-first CSS |
| Routing | React Router v6 (HashRouter) | Client-side routing |
| HTTP Client | Axios | API requests |
| Backend | Node.js + Express | REST API server |
| ORM | Prisma v5 | Database access |
| Database | PostgreSQL | Data storage |
| Auth | JWT + bcrypt | Staff and parent authentication |
| File Uploads | Multer | Photo handling |
| Frontend Host | GitHub Pages | Static site hosting |
| Backend Host | Render (free tier) | Node.js hosting |
| Database Host | Supabase (free tier) | Managed PostgreSQL |

---

## Project Structure

```
trustpaws/
├── client/                    # React frontend
│   ├── public/
│   │   └── 404.html           # GitHub Pages SPA fallback
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # StaffLayout, sidebar
│   │   │   └── ui/            # StatusBadge, Modal, etc.
│   │   ├── context/           # AuthContext, ParentAuthContext
│   │   ├── pages/
│   │   │   ├── staff/         # Dashboard, Appointments, Pets, Parents, Monitor
│   │   │   └── parent/        # ParentPortal, ParentLogin, TrackingPage
│   │   └── utils/
│   │       ├── api.js          # Axios instance + interceptors
│   │       ├── constants.js    # Status flow, labels
│   │       └── mockApi.js      # Local mock (set MOCK=false for production)
│   ├── .env.production        # VITE_API_URL for production build
│   └── vite.config.js
│
├── server/                    # Node.js backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js        # Staff login/register
│   │   │   ├── parentAuth.js  # Parent login, PIN management, /me endpoint
│   │   │   ├── appointments.js
│   │   │   ├── parents.js
│   │   │   ├── pets.js
│   │   │   ├── incidents.js
│   │   │   ├── photos.js
│   │   │   └── tracking.js    # Public tracking link endpoint
│   │   ├── seed.js            # Demo data seeder
│   │   └── index.js           # Express app entry point
│   └── .env.example
│
└── .github/
    └── workflows/
        └── deploy.yml         # GitHub Actions — auto-deploy to GitHub Pages
```

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a Supabase connection string)

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/trustpaws"
JWT_SECRET="any-long-random-string"
PORT=3001
CLIENT_URL="http://localhost:5173"
```

For the frontend, create `client/.env.local`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Set up the database
```bash
cd server
./node_modules/.bin/prisma db push
node src/seed.js
```

### 4. Run the app
```bash
npm run dev
```
- Staff portal: http://localhost:5173
- API: http://localhost:3001

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS |

### Client (`client/.env.production`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `https://trustpaws.onrender.com`) |

---

## Database

### Schema overview

| Model | Description |
|---|---|
| `User` | Staff and admin accounts |
| `Parent` | Pet parent profiles (phone + PIN auth) |
| `Pet` | Pet profiles linked to a parent |
| `Appointment` | A grooming session with status, tracking token |
| `AppointmentService` | Individual services within an appointment |
| `Incident` | Incidents logged during an appointment |
| `Photo` | Before/after/during photos |

### Resetting / reseeding
```bash
DATABASE_URL="..." ./node_modules/.bin/prisma db push --force-reset
DATABASE_URL="..." node src/seed.js
```

---

## Deployment

### Backend — Render
- **Root directory:** `server`
- **Build command:** `npm install && ./node_modules/.bin/prisma generate`
- **Start command:** `npm start`
- **Environment variables:** Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL=*`, `NODE_ENV=production`

### Frontend — GitHub Pages
Deployed automatically via GitHub Actions on every push to `main`.

Workflow file: `.github/workflows/deploy.yml`

The frontend is built with `VITE_API_URL=https://trustpaws.onrender.com` injected at build time.

### Running migrations on production DB (from local machine)
```bash
cd server
DATABASE_URL="your-supabase-url" ./node_modules/.bin/prisma db push
DATABASE_URL="your-supabase-url" node src/seed.js
```

---

## Demo Credentials

| Role | Login | Password / PIN |
|---|---|---|
| Admin | admin@huft.com | admin123 |
| Staff | groomer@huft.com | staff123 |
| Parent | Phone: 9999999999 | PIN: 1234 |

---

## Feature Reference

### Appointment Status Flow
```
SCHEDULED → CHECKED_IN → BATHING → GROOMING → DRYING → READY → COMPLETED
```

### Service Completion Form (Staff)
When marking a service complete, staff fill out:
- **Condition:** Good / Sensitive area noted / Needs attention
- **Observations:** Free-text notes visible to the parent

Notes are stored as JSON in the `AppointmentService.notes` field.

### Parent Authentication
Parents authenticate with **phone number + PIN**. PINs are set by staff via the Parents page. Tokens are stored separately from staff tokens (`parent_token` vs `token` in localStorage).

### Tracking Links
Each appointment has a unique `trackingToken` (UUID). The public tracking page at `/#/track/:token` requires no login and auto-refreshes every 30 seconds.

### Incident Severity Levels
- **Low** — minor, no harm
- **Medium** — needs attention
- **High** — serious incident

All incidents are shown transparently to parents on both the live tracking page and the parent portal's "Noted Issues" tab.
