# 🚀 CAREERPILOT AI — AGENT HANDOFF PROMPT

You are taking over development of **CareerPilot AI**, an AI-powered Career Operating System designed to help job seekers optimize their resumes, analyze market intelligence, and perform semantic job matching.

---

## 📌 CURRENT ARCHITECTURE

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn UI patterns.
- **Backend**: Node.js, Express, TypeScript, Zod validation, JWT authentication, bcrypt password hashing.
- **Database**: PostgreSQL 16 with `pgvector` extension enabled (`pgvector/pgvector:pg16` Docker container).
- **ORM**: Prisma ORM v5 (`@prisma/client`) with `postgresqlExtensions` (`vector`).
- **AI & Embedding Engine**: SentenceTransformers (`Xenova/all-MiniLM-L6-v2` - 384-dimensional dense vectors with explicit L2 normalization).
- **Storage Service**: Decoupled `StorageService` with `LocalStorageProvider` (`uploads/resumes/`).

---

## ✅ COMPLETED & VERIFIED PHASES

1. **Phase 1 — Foundation**:
   - Monorepo structure (`frontend/`, `backend/`, `shared/`).
   - Express backend & React Vite frontend configured with TypeScript and Tailwind CSS.
2. **Phase 2 — Authentication System**:
   - `User` model with bcrypt password hashing and JWT authentication middleware.
   - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
3. **Phase 3 — User Profile & Career Goals**:
   - `Profile` and `CareerGoal` Prisma models with deterministic profile completion calculation (0–100%).
   - Full CRUD API endpoints and reactive frontend Profile Manager.
4. **Database Upgrade to pgvector**:
   - Upgraded database container to `pgvector/pgvector:pg16`.
   - Enabled `vector` extension in Prisma schema (`extensions = [vector]`).
5. **Dashboard UI Modernization**:
   - Live pulsating online status indicator, dynamic time-based greeting.
   - 2x2 Quick Action grid mapping to distinct tab routes (`/profile#bio`, `/profile#skills`, `/profile#resume`, `/profile#settings`).
   - Modern Resume ATS Analytics card with circular SVG progress meter.
6. **Phase 4A — Resume Intelligence Foundation**:
   - `Resume` Prisma model with cascade deletion relationship to `User`.
   - `GET /api/resumes` and `GET /api/resumes/:id` with strict JWT ownership verification.
7. **Phase 4B — Resume File Upload**:
   - Multer middleware for file type validation (`.pdf`, `.doc`, `.docx`) and 10MB size limit.
   - `StorageService` saving files to `uploads/resumes/`.
   - `POST /api/resumes/upload` endpoint and frontend drag-and-drop zone integration.
8. **Phase 4F — Resume Embedding Pipeline**:
   - `ResumeChunk` model in PostgreSQL with `pgvector` vector column (`vector(384)`).
   - Centralized embedding configuration in `backend/src/config/embedding.config.ts`.
   - Section-aware semantic chunking strategy (`chunkingVersion = "v1"`).
   - SentenceTransformers embedding generator with explicit **L2-normalization** ($\|v\|_2 = 1.0$) so dot product equals cosine similarity.
   - SHA-256 content hashing to reuse unchanged chunk embeddings on subsequent uploads.
   - `POST /api/resumes/:id/embed` endpoint returning embedding metadata and status.

---

## 🛠 HOW TO RUN THE PROJECT

```bash
# 1. Start PostgreSQL with pgvector container
docker-compose up -d

# 2. Run Database Migrations (in backend/)
cd backend
npx prisma db push

# 3. Start Backend Server (runs on http://localhost:5000)
npm run dev

# 4. Start Frontend Dev Server (runs on http://localhost:5173)
cd ../frontend
npm run dev

# 5. Run Backend Integration & Embedding Tests (51 tests)
cd ../backend
npm test
```

---

## 🚨 MANDATORY DEVELOPMENT RULES FOR NEXT AGENT

1. **INCREMENTAL DEVELOPMENT ONLY**: Implement ONLY one small phase at a time.
2. **VERIFY BEFORE MOVING ON**: Run tests (`npm test`), build (`npm run build`), and linting (`npm run lint`) after every phase.
3. **NEVER ALTER PGVECTOR ARCHITECTURE**: Do NOT replace PostgreSQL, do NOT disable `pgvector`, and do NOT introduce external vector databases or Redis unless specified in the phase.
4. **ENFORCE OWNERSHIP SECURITY**: Every user-owned resource must verify `req.user.id` from JWT. Never trust user ID sent from frontend body/params.
5. **STOP AND REPORT**: After completing a phase, produce a completion summary report and STOP. Wait for user approval before moving to the next phase.
