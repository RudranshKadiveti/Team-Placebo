# 🕸️ Modular Web & Resume Scraping Microservice

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Async-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/python/)
[![Streamlit](https://img.shields.io/badge/Streamlit-UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Extraction-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A plug-and-play, decoupled web and document scraping microservice featuring an asynchronous headless Playwright engine, an AI Resume/CV Parser, a Google Gemini structured extraction router, multi-format export capabilities (**CSV, JSON, Text, Markdown, Terraform**), database persistence (PostgreSQL & SQLite), and an interactive Streamlit dashboard.

---

## 🌟 Key Features

- 📄 **AI-Powered Resume / CV Parser**: Upload PDF, Microsoft Word (`.docx`), or plain text (`.txt`) candidate resumes for instant structured extraction of contact details, executive summary, skills, work experience timeline, education, certifications, and projects.
- 🏗️ **Strictly Decoupled Architecture**: UI contains zero browser launching code; all browser actions, document parsers, and LLM routers are encapsulated inside the `core` package.
- ⚡ **Asynchronous Playwright Engine**: High-speed, fault-tolerant headless browser automation with anti-detection evasions and fast DOM loading strategies.
- 🤖 **Agentic & Direct Web Modes**:
  - **Direct Scrape**: Fast raw text (`innerText`) page content extraction.
  - **Agentic Scrape**: Natural language prompt-driven extraction powered by Google Gemini AI with Pydantic schema validation.
- 💾 **Multi-Format Downloads**: Export scraped datasets & candidate profiles in 5 formats:
  - **JSON (`.json`)**: Structured JSON payload.
  - **CSV (`.csv`)**: Tabular data ready for Excel & Google Sheets.
  - **Markdown (`.md`)**: GitHub-style markdown reports with formatted tables.
  - **Text (`.txt`)**: Plain-text summary and extraction logs.
  - **Terraform (`.tf`)**: Native HCL configuration format mapping data into `locals` blocks.
- 🗄️ **Enterprise Database Support**:
  - **PostgreSQL**: Production-ready relational storage with `JSONB` document support.
  - **SQLite Fallback**: Zero-config local embedded storage (`storage/scraped_data.db`).
- 🐳 **Docker & Docker Compose Ready**: Includes a pre-configured `Dockerfile` with system dependencies and a `docker-compose.yml` linking the PostgreSQL database and microservice containers.

---

## 📁 Repository Structure

```text
.
├── core/
│   ├── engine.py           # Async Playwright Headless Browser Engine (BrowserEngine, EngineConfig)
│   ├── scraper.py          # Web Extraction Router for Direct & Gemini Agentic Modes (ModularScraper)
│   ├── resume_parser.py    # Multi-Format Resume/CV Extraction Engine (ResumeParser, ResumeParseResult)
│   ├── db.py               # Database Persistence (PostgreSQL & SQLite helpers)
│   └── __init__.py         # Core Package Initializer
├── ui/
│   └── app.py              # Streamlit Web UI, Candidate Profile Dashboard & Multi-Format Downloader
├── storage/                # Local data persistence & SQLite database directory
├── .env                    # Environment variables configuration
├── .gitignore              # Git ignore rules
├── Dockerfile              # Docker image specification with Playwright Chromium
├── docker-compose.yml      # Docker Compose orchestration (PostgreSQL + Microservice)
└── requirements.txt        # Python dependencies manifest
```

---

## 🚀 Quick Start Guide

### Prerequisites

1. Clone the repository:
   ```bash
   git clone https://github.com/suraj14611/Ai_web_scrapper.git
   cd Ai_web_scrapper
   ```

2. Configure environment variables in `.env`:
   ```env
   # Google Gemini API Key (Get a free key from https://aistudio.google.com/)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional PostgreSQL Configuration
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=web_scraper_db
   ```

---

### Option 1: Run Locally (Python)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Install Playwright browser binaries
playwright install chromium

# 3. Launch Streamlit UI
python -m streamlit run ui/app.py
```

Open **`http://localhost:8501`** in your web browser.

---

### Option 2: Run via Docker Compose (Recommended)

Spins up both the **PostgreSQL Database** and the **Web Scraper Microservice** inside Docker containers:

```bash
docker compose up --build -d
```

Open **`http://localhost:8501`** in your web browser.

---

## 📄 Resume / CV Parsing Usage

### Via Streamlit UI
1. Navigate to the **`📄 Resume / CV Parser`** tab in the dashboard.
2. Upload a candidate resume file (**PDF, DOCX, or TXT**).
3. Optionally add custom focus instructions (e.g. *"Highlight Python experience and cloud certifications"*).
4. Click **`⚡ Parse Resume with Gemini AI`** to view candidate dashboard cards & download results in JSON, CSV, TXT, Markdown, or Terraform HCL formats!

### Programmatically via Python
```python
import asyncio
from core import ResumeParser

async def parse_candidate_cv():
    with open("candidate_resume.pdf", "rb") as f:
        file_bytes = f.read()

    parser = ResumeParser()
    result = await parser.parse_resume(
        file_bytes=file_bytes,
        filename="candidate_resume.pdf"
    )

    print("Candidate Name:", result.candidate_name)
    print("Email:", result.email)
    print("Skills:", result.skills)
    print("Work Experience:", result.work_experience)

if __name__ == "__main__":
    asyncio.run(parse_candidate_cv())
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
