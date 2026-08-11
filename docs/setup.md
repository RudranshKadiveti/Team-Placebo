# CareerPilot AI - Infrastructure Setup & Developer Guide

## Architecture Overview

```text
Frontend (React + Vite + TS + Tailwind)
   ↓ Axios
Backend (Node.js + Express + TS)
   ↓ Prisma ORM
PostgreSQL Database
```

## Prerequisites

- Node.js (v18+ recommended)
- npm or pnpm
- Docker & Docker Compose (for local PostgreSQL)

## Step-by-step Setup

### 1. Database Setup
Start PostgreSQL container via Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate to `/backend`:
```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

### 3. Frontend Setup
Navigate to `/frontend`:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Verification

Access `http://localhost:5173` to see the live status dashboard.
Health check endpoint: `http://localhost:5000/api/health`
