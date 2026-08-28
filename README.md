# CareerPilot AI & Web Scraping Microservice

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Async-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/python/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Extraction-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

CareerPilot AI is an AI-powered career intelligence platform combined with a modular Python Web & Resume Scraping Microservice.

---

## 🏗️ System Architecture

```text
Frontend (React + Vite + TypeScript + Tailwind CSS)  ──► localhost:5173
   │
   ▼ (Axios HTTP API Calls)
Backend (Node.js + Express + TypeScript + Prisma)   ──► localhost:5000
   │
   ▼ (Database Connection & pgvector)
PostgreSQL Database (pgvector/pgvector:pg16)         ──► localhost:5433
   │
   ▲ (Microservice Engine)
Python Web & Resume Scraper (Playwright + Gemini AI) ──► localhost:8501
```

---

## 🌟 Features Breakdown

### 1. CareerPilot AI Web Application
- 🔑 **Authentication & User Management**: User registration, JWT authentication, and secure login endpoints.
- 👤 **Profile & Career Goals**: Manage user profile data, target job roles, skills inventory, and career aspirations.
- 📄 **Resume Upload & Parsing Engine**: PDF resume parser, text chunker service, and embedding generator (`pgvector`).
- 🎯 **ATS Scoring & Vector Search**: Automatic ATS compatibility scoring and vector embedding search.
- 🎨 **Modern Frontend Interface**: Built with React, Vite, TypeScript, and Tailwind CSS.

### 2. Python Scraping & Resume Microservice (`/core` & `/ui`)
- 📄 **AI Resume/CV Parsing**: Extract PDF, DOCX, and TXT resumes into strict Pydantic JSON schemas with real-life ATS weightage scores (45% Keyword/Skills, 25% Formatting, 25% Impact, 10% Structure).
- ⚡ **Playwright Browser Automation**: Decoupled async Playwright engine supporting Direct scrape and Gemini Agentic scraping.
- 💾 **Multi-Format Export**: Download extractions in CSV, JSON, Text, Markdown, and Terraform (`.tf`) formats.

---

## 📁 Repository Structure

```text
.
├── backend/                # Node.js + Express + TypeScript API Server
│   ├── prisma/             # Database Schemas & Migrations (PostgreSQL + pgvector)
│   ├── src/                # Controllers, Routes, Services, Middlewares
│   └── tests/              # Jest Integration Tests
├── frontend/               # React + Vite + TypeScript + Tailwind CSS Dashboard
│   ├── src/                # Components, Pages, Context, Hooks, Services
├── core/                   # Python Scraping Engine (Playwright + Gemini AI)
├── ui/                     # Streamlit Microservice UI Dashboard
├── docker-compose.yml      # PostgreSQL (pgvector) + Python Microservice Orchestration
├── HANDOFF_PROMPT.md       # Development Handoff & Architecture Notes
└── UPCOMING_ROADMAP.md     # Upcoming Feature Roadmap & Tasks
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Python**: `3.11+`
- **Docker & Docker Compose** (for PostgreSQL + pgvector)

---

### Step 1: Start PostgreSQL Database
```bash
docker-compose up -d
```

---

### Step 2: Set Up & Run Node.js Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Backend API will start at **`http://localhost:5000`**.

---

### Step 3: Set Up & Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will start at **`http://localhost:5173`**.

---

### Step 4: Run Python Scraping & Resume Microservice (Optional)
```bash
pip install -r requirements.txt
playwright install chromium
python -m streamlit run ui/app.py
```
Streamlit Dashboard will start at **`http://localhost:8501`**.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
