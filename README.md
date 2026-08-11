# CareerPilot AI

Your AI-powered career intelligence platform.

## Architecture

```text
Frontend (React + Vite + TypeScript + Tailwind CSS)
   │
   ▼ (Axios HTTP API Calls)
Backend (Node.js + Express + TypeScript)
   │
   ▼ (Prisma Client)
Prisma ORM
   │
   ▼ (Database Connection)
PostgreSQL Database
```

---

## Requirements

Ensure you have the following installed on your machine:

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **Docker** & **Docker Compose** (for running local PostgreSQL instance)
- **Git**

---

## Setup Instructions

### 1. Clone the Project

```bash
git clone <repository-url>
cd careerpilot
```

### 2. Environment Variables Setup

Copy `.env.example` files to `.env` in both backend and frontend:

```bash
# Backend .env
cp backend/.env.example backend/.env

# Frontend .env
cp frontend/.env.example frontend/.env
```

### 3. Start PostgreSQL Database

Start the PostgreSQL database service using Docker Compose:

```bash
docker-compose up -d
```

### 4. Install Dependencies & Set Up Prisma

#### Backend Setup:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

#### Frontend Setup:

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Start the Backend

From the `/backend` directory:

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`.

### Start the Frontend

From the `/frontend` directory:

```bash
npm run dev
```

The frontend application will start on `http://localhost:5173`.

---

## Development URLs

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Health Check API

To verify the status of the backend server and its database connection, run:

```bash
curl http://localhost:5000/api/health
```

### Expected Successful Response (200 OK):

```json
{
  "success": true,
  "message": "CareerPilot API is running",
  "database": "connected"
}
```

### Degraded Response when Database is down (503 Service Unavailable):

```json
{
  "success": false,
  "message": "CareerPilot API is running",
  "database": "disconnected"
}
```

---

## Scripts

### Backend Scripts
- `npm run dev` — Run development server with live reloads
- `npm run build` — Compile TypeScript to JavaScript in `./dist`
- `npm run start` — Run production server
- `npm run lint` — Lint backend codebase
- `npm run format` — Format backend code with Prettier
- `npm test` — Run backend integration tests

### Frontend Scripts
- `npm run dev` — Run Vite development server
- `npm run build` — Type-check and build production assets
- `npm run preview` — Locally preview production build
- `npm run lint` — Lint frontend codebase
- `npm run format` — Format frontend code with Prettier
