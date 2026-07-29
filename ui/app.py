import os
import sys
import asyncio
import re
import csv
import json
import io
import importlib
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import streamlit as st
from dotenv import load_dotenv

# Ensure project root directory is in sys.path for clean imports
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Storage directory path
storage_dir = project_root / "storage"
storage_dir.mkdir(exist_ok=True)

# Import core submodules with force-reload to ensure changes take effect without server restart
import core.engine
import core.scraper
import core.db
importlib.reload(core.engine)
importlib.reload(core.scraper)
importlib.reload(core.db)

from core.engine import EngineConfig, BrowserEngine
from core.scraper import ModularScraper, AgenticScrapeResult
from core.db import (
    init_db, 
    save_scrape_record, 
    get_recent_scrapes, 
    delete_scrape_record
)

# Initialize Database
init_db()

# Load environment variables from .env if present
load_dotenv(dotenv_path=project_root / ".env", override=True)

# Streamlit Page Configuration
st.set_page_config(
    page_title="Web Scraping Microservice",
    page_icon="🕸️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium UI Aesthetics
st.markdown("""
    <style>
    .main-header {
        font-family: 'Inter', sans-serif;
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #4285f4 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        color: #94a3b8;
        font-size: 1rem;
        margin-bottom: 1.5rem;
    }
    .stButton > button {
        background: linear-gradient(135deg, #4285f4 0%, #a855f7 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    </style>
""", unsafe_allow_html=True)


def clean_and_validate_url(raw_input: str) -> tuple[str, bool]:
    """Extract and validate clean URL from user input string."""
    text = raw_input.strip()
    if not text:
        return "", False
    
    # Extract embedded URL if user accidentally pasted error logs containing a URL
    url_match = re.search(r'https?://[^\s"\'<>]+', text)
    if url_match:
        text = url_match.group(0)
    elif not text.startswith(("http://", "https://")):
        text = "https://" + text

    try:
        parsed = urlparse(text)
        is_valid = bool(parsed.scheme in ("http", "https") and parsed.netloc and "." in parsed.netloc)
        return text, is_valid
    except Exception:
        return text, False


def run_async_task(coro):
    """Safely execute an async coroutine inside Streamlit's synchronous thread context."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def generate_csv_data(results_dict: dict) -> str:
    """Convert a dictionary into CSV string format."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Field Name / Key", "Extracted Value"])
    for key, val in results_dict.items():
        writer.writerow([key, str(val)])
    return output.getvalue()


def main():
    st.markdown('<div class="main-header">Modular Scraping Microservice</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Decoupled Playwright Engine, Gemini Agentic Router & Database Persistence</div>', unsafe_allow_html=True)

    # Sidebar Configurations
    st.sidebar.title("⚙️ Engine Settings")
    
    # Check if GEMINI_API_KEY exists in environment / .env
    env_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if env_api_key:
        st.sidebar.success("🔑 Gemini API Key detected from `.env`")
    else:
        st.sidebar.warning("⚠️ No API Key found in `.env`")

    gemini_api_key_input = st.sidebar.text_input(
        "Gemini API Key (Override)",
        value="",
        type="password",
        placeholder="Using key from .env" if env_api_key else "Enter API key here...",
        help="Optional: Leave blank to automatically use the GEMINI_API_KEY from your .env file."
    )

    # Resolve effective API Key (manual input takes precedence, fallback to .env)
    effective_api_key = gemini_api_key_input.strip() or env_api_key

    gemini_model = st.sidebar.selectbox(
        "Gemini Model",
        options=["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"],
        index=0,
        help="gemini-2.5-flash has high free-tier rate limits and fast execution."
    )

    headless_mode = st.sidebar.toggle(
        "Headless Mode",
        value=True,
        help="Run browser in background without visible window"
    )

    proxy_server = st.sidebar.text_input(
        "Proxy Server (Optional)",
        value="",
        placeholder="e.g. http://proxy.example.com:8080"
    )

    user_agent = st.sidebar.text_input(
        "Custom User-Agent (Optional)",
        value="",
        placeholder="Mozilla/5.0 ..."
    )

    st.sidebar.markdown("---")
    st.sidebar.info("💡 **Decoupled Architecture**: Database persistence initialized with PostgreSQL & SQLite support.")

    # Tabs for Main Interface and Database History
    tab_scrape, tab_history = st.tabs(["🚀 New Scrape", "📜 Database & History"])

    with tab_scrape:
        # Main Layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            target_url_input = st.text_input(
                "Target URL",
                placeholder="https://www.amazon.in/s?k=iphone",
                help="Enter the full URL of the target webpage"
            )
        
        with col2:
            scrape_mode = st.radio(
                "Extraction Mode",
                options=["Direct Scrape", "Agentic Scrape"],
                help="Direct mode returns raw innerText. Agentic mode extracts structured JSON via Gemini."
            )

        prompt = ""
        if scrape_mode == "Agentic Scrape":
            prompt = st.text_area(
                "Intent Prompt",
                placeholder="e.g., Extract all product names, prices, and ratings from the page into structured JSON.",
                height=120,
                help="Specify what structured data you want Gemini to extract from the webpage text."
            )

        start_button = st.button("🚀 Start Scraping", use_container_width=False)

        if start_button:
            target_url, is_valid = clean_and_validate_url(target_url_input)
            
            if not target_url or not is_valid:
                st.error("Invalid URL format. Please paste a clean web URL (e.g., `https://www.amazon.in/s?k=iphone+17+pro`).")
                return

            # Build EngineConfig from UI parameters
            config = EngineConfig(
                headless=headless_mode,
                proxy_server=proxy_server if proxy_server.strip() else None,
                user_agent=user_agent if user_agent.strip() else None
            )

            scraper = ModularScraper(config=config)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            if scrape_mode == "Direct Scrape":
                with st.spinner("⏳ Running Direct Scrape via Headless Engine..."):
                    try:
                        raw_text = run_async_task(scraper.run_direct_scrape(target_url))
                        st.success("Direct scrape completed successfully!")
                        
                        # Save record to Database
                        record_id = save_scrape_record(
                            url=target_url,
                            mode="Direct Scrape",
                            raw_text=raw_text,
                            summary=f"Direct text scrape of {target_url}"
                        )
                        st.caption(f"💾 Saved record to Database (ID: `{record_id}`)")

                        st.subheader("📄 Raw Extracted Text")
                        st.code(raw_text[:2000] + ("\n... [truncated for display]" if len(raw_text) > 2000 else ""), language="text")

                        # Download options
                        st.markdown("---")
                        st.subheader("💾 Export & Download Options")
                        st.download_button(
                            label="📥 Download Raw Text (.txt)",
                            data=raw_text,
                            file_name=f"direct_scrape_{timestamp}.txt",
                            mime="text/plain"
                        )
                    except Exception as e:
                        st.error(f"Scraping Error: {str(e)}")

            elif scrape_mode == "Agentic Scrape":
                if not prompt.strip():
                    st.warning("Please provide an Intent Prompt for Agentic Scrape.")
                    return

                if not effective_api_key:
                    st.error("Gemini API Key is missing. Please set `GEMINI_API_KEY` in your `.env` file or enter it in the sidebar.")
                    return

                with st.spinner(f"🤖 Executing Agentic Scrape (Browser Extraction + {gemini_model} Structuring)..."):
                    try:
                        result = run_async_task(
                            scraper.run_agentic_scrape(
                                url=target_url,
                                prompt=prompt,
                                gemini_api_key=effective_api_key,
                                model_name=gemini_model
                            )
                        )
                        st.success("Agentic scrape completed successfully!")
                        
                        result_dict = result.to_dict()
                        
                        # Save record to Database
                        record_id = save_scrape_record(
                            url=target_url,
                            mode="Agentic Scrape",
                            prompt=prompt,
                            summary=result.summary,
                            results=result_dict.get("results", {})
                        )
                        st.caption(f"💾 Saved record to Database (ID: `{record_id}`)")

                        st.subheader("📊 Structured JSON Result")
                        st.json(result_dict)

                        with st.expander("📝 Summary", expanded=True):
                            st.write(result.summary)

                        # Prepare Formatted Exports
                        json_data = json.dumps(result_dict, indent=2)
                        csv_data = generate_csv_data(result.results)
                        txt_data = f"SUMMARY:\n{result.summary}\n\nEXTRACTED DATA:\n{json_data}"

                        # Download Buttons UI
                        st.markdown("---")
                        st.subheader("💾 Export & Download Options")
                        
                        d_col1, d_col2, d_col3 = st.columns(3)
                        
                        with d_col1:
                            st.download_button(
                                label="📥 Download JSON (.json)",
                                data=json_data,
                                file_name=f"scrape_{timestamp}.json",
                                mime="application/json",
                                use_container_width=True
                            )
                        
                        with d_col2:
                            st.download_button(
                                label="📊 Download CSV (.csv)",
                                data=csv_data,
                                file_name=f"scrape_{timestamp}.csv",
                                mime="text/csv",
                                use_container_width=True
                            )
                        
                        with d_col3:
                            st.download_button(
                                label="📄 Download Summary (.txt)",
                                data=txt_data,
                                file_name=f"scrape_{timestamp}.txt",
                                mime="text/plain",
                                use_container_width=True
                            )

                    except Exception as e:
                        st.error(f"Agentic Scraping Error: {str(e)}")

    with tab_history:
        st.subheader("📜 Stored Scrape Records")
        records = get_recent_scrapes(limit=50)

        if not records:
            st.info("No records found in database. Perform a scrape to store historical results!")
        else:
            st.write(f"Showing **{len(records)}** recent database records:")
            
            for rec in records:
                rec_id = rec["id"]
                url = rec["url"]
                mode = rec["mode"]
                created_at = rec["created_at"]
                summary = rec.get("summary") or "No summary"
                results = rec.get("results", {})
                
                with st.expander(f"📌 Record #{rec_id} | {mode} | {url[:60]}... ({created_at})"):
                    st.write(f"**Target URL:** {url}")
                    st.write(f"**Mode:** `{mode}`")
                    st.write(f"**Date:** `{created_at}`")
                    if rec.get("prompt"):
                        st.write(f"**Prompt:** {rec['prompt']}")
                    
                    st.write(f"**Summary:** {summary}")

                    if results:
                        st.json(results)
                        json_str = json.dumps(results, indent=2)
                        csv_str = generate_csv_data(results)

                        h_col1, h_col2 = st.columns(2)
                        with h_col1:
                            st.download_button(
                                label=f"📥 Download JSON (Record #{rec_id})",
                                data=json_str,
                                file_name=f"record_{rec_id}.json",
                                mime="application/json",
                                key=f"dl_json_{rec_id}"
                            )
                        with h_col2:
                            st.download_button(
                                label=f"📊 Download CSV (Record #{rec_id})",
                                data=csv_str,
                                file_name=f"record_{rec_id}.csv",
                                mime="text/csv",
                                key=f"dl_csv_{rec_id}"
                            )


if __name__ == "__main__":
    main()
