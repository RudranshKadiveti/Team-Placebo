# 🗺️ CAREERPILOT AI — UPCOMING DEVELOPMENT ROADMAP

This document outlines all remaining phases and features to be implemented in CareerPilot AI.

---

## 📌 REMAINING PHASES & ROADMAP

### Phase 4C — Structured Resume Section Parsing
- Parse raw resume text into structured sections (Summary, Technical Skills, Professional Experience, Education, Projects, Certifications).
- Store structured JSON output in database (`structuredContent`).

### Phase 4D — AI Resume ATS Scoring & Performance Engine
- Implement ATS scoring algorithm evaluating:
  - Overall ATS Match Score (0–100%).
  - Keyword Match Ratio (e.g., 18/25).
  - Formatting Check & Readability Score.
  - Section Completeness Score.
  - Actionable Improvement Suggestions.
- Render dynamic ATS performance breakdown UI on Dashboard.

### Phase 4E — AI Resume Bullet Point Tailoring & Enhancement
- AI-assisted bullet point rewriting for high impact (Action Verb + Context + Quantifiable Result).
- Target role skill gap identification.

### Phase 5 — Job Scraping Engine & Market Intelligence Integration
- Plug-and-play integration of external job scraper module.
- Ingest target job descriptions into `jobs` table (Title, Company, Location, Description, Required Skills, Salary Range).

### Phase 6 — Job Description Embedding & Semantic Matching Pipeline
- Generate 384-dimensional L2-normalized `pgvector` embeddings for job descriptions using the same `Xenova/all-MiniLM-L6-v2` space.
- Compute cosine similarity matrix between Resume chunk embeddings $R \in \mathbb{R}^{n \times 384}$ and Job embeddings $J \in \mathbb{R}^{m \times 384}$.
- Return ranked semantic skill match percentage and missing target skills.

### Phase 7 — LangGraph AI Multi-Agent Career Coaching System
- Python LangGraph workflow orchestration with IBM Granite / watsonx integration.
- Specialized agents:
  - **Resume Auditor Agent**
  - **Career Advisor Agent**
  - **Interview Prep Agent**

### Phase 8 — GitHub Repository & Portfolio Intelligence
- Connect user GitHub profile to analyze code repositories, languages, and technical project complexity.

### Phase 9 — Real-time Analytics & Notification Engine
- Application tracking pipeline (Saved, Applied, Interviewing, Offered).
- Real-time job alert notifications.

---

## ⚡ NEXT IMMEDIATE STEP: Phase 4C (Structured Resume Parsing) or Phase 4D (ATS Performance Engine)
