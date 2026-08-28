# 🗺️ CAREERPILOT AI — UPCOMING DEVELOPMENT ROADMAP

This document outlines all remaining phases and features to be implemented in CareerPilot AI.

---

## 📌 REMAINING PHASES & ROADMAP

### Phase 4E — AI Resume Bullet Point Tailoring & Enhancement (NEXT)
- **AI-assisted Bullet Point Rewriting:** Feature that rewrites weak resume bullet points into high-impact ATS-optimized statements (Action Verb + Context + Quantifiable Result).
- **Target Role Skill Gap Identification:** Allow users to input a target Job Title or Description. The AI compares it against their parsed resume and identifies missing keywords, skills, or experience gaps.
- **Dynamic Action Plan:** Generate actionable steps on how to bridge the identified skill gaps.

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

## ⚡ NEXT IMMEDIATE STEP: Phase 4E (AI Resume Bullet Point Tailoring & Enhancement)
