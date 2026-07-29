# 🕸️ Modular Web Scraping Microservice

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Async-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/python/)
[![Streamlit](https://img.shields.io/badge/Streamlit-UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Extraction-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A plug-and-play, decoupled web scraping microservice featuring an asynchronous headless Playwright engine, a Google Gemini AI-powered structured extraction router, multi-format export capabilities (**CSV, JSON, Text, Markdown, Terraform**), database persistence (PostgreSQL & SQLite), and an interactive Streamlit dashboard.

---

## 🌟 Key Features

- 🏗️ **Strictly Decoupled Architecture**: UI contains zero browser launching code; all browser actions and LLM routers are encapsulated inside the `core` package.
- ⚡ **Asynchronous Playwright Engine**: High-speed, fault-tolerant headless browser automation with anti-detection evasions and fast DOM loading strategies.
- 🤖 **Agentic & Direct Modes**:
  - **Direct Scrape**: Fast raw text (`innerText`) page content extraction.
  - **Agentic Scrape**: Natural language prompt-driven extraction powered by Google Gemini AI with Pydantic schema validation.
- 💾 **Multi-Format Downloads**: Export scraped datasets in 5 formats:
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
│   ├── engine.py       # Async Playwright Headless Browser Engine (BrowserEngine, EngineConfig)
│   ├── scraper.py      # Extraction Router for Direct & Gemini Agentic Modes (ModularScraper)
│   ├── db.py           # Database Persistence (PostgreSQL & SQLite helpers)
│   └── __init__.py     # Core Package Initializer
├── ui/
│   └── app.py          # Interactive Streamlit Web Interface & Multi-Format Downloader
├── storage/            # Local data persistence & SQLite database directory
├── .env                # Environment variables configuration
├── .gitignore          # Git ignore rules
├── Dockerfile          # Docker image specification with Playwright Chromium
├── docker-compose.yml  # Docker Compose orchestration (PostgreSQL + Microservice)
└── requirements.txt    # Python dependencies manifest
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

To stop the containers:
```bash
docker compose down
```

---

## 🛠️ Programmatic Core Usage

You can easily import and use the `core` extraction engine in your own Python applications or microservices:

```python
import asyncio
from core import EngineConfig, ModularScraper

async def run_scraper():
    # 1. Initialize Engine Configuration
    config = EngineConfig(headless=True)
    scraper = ModularScraper(config=config)

    # 2. Direct Scrape Example
    raw_text = await scraper.run_direct_scrape("https://example.com")
    print("Direct Text Output:", raw_text[:500])

    # 3. Agentic LLM Extraction Example
    result = await scraper.run_agentic_scrape(
        url="https://example.com",
        prompt="Extract all key headings, main topics, and contact emails.",
        model_name="gemini-flash-latest"
    )

    print("Summary:", result.summary)
    print("Structured Results:", result.results)

if __name__ == "__main__":
    asyncio.run(run_scraper())
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
