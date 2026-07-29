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


def generate_csv_data(results_data) -> str:
    """Convert extracted data into CSV string format."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    if isinstance(results_data, dict):
        # Fallback for old single dict format
        writer.writerow(["Field Name / Key", "Extracted Value"])
        for key, val in results_data.items():
            writer.writerow([key, str(val)])
    elif isinstance(results_data, list) and len(results_data) > 0:
        # Proper tabular CSV for list of objects
        headers = []
        for row in results_data:
            for k in row.keys():
                if k not in headers:
                    headers.append(k)
        
        writer.writerow(headers)
        for row in results_data:
            writer.writerow([str(row.get(h, "")) for h in headers])
            
    return output.getvalue()


def generate_markdown_data(summary: str, results_data, url: str) -> str:
    """Convert extracted results into clean Markdown document format."""
    md = f"# Web Scrape Report\n\n"
    md += f"**Source URL:** [{url}]({url})\n"
    md += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    md += f"## Executive Summary\n\n{summary}\n\n"
    md += f"## Extracted Data Results\n\n"
    
    if isinstance(results_data, dict):
        md += f"| Field / Attribute | Value |\n"
        md += f"| :--- | :--- |\n"
        for k, v in results_data.items():
            clean_k = str(k).replace("|", "\\|")
            clean_v = str(v).replace("|", "\\|").replace("\n", " ")
            md += f"| **{clean_k}** | {clean_v} |\n"
    elif isinstance(results_data, list) and len(results_data) > 0:
        headers = []
        for row in results_data:
            for k in row.keys():
                if k not in headers:
                    headers.append(k)
        
        md += "| " + " | ".join([h.replace("|", "\\|") for h in headers]) + " |\n"
        md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
        for row in results_data:
            row_vals = [str(row.get(h, "")).replace("|", "\\|").replace("\n", " ") for h in headers]
            md += "| " + " | ".join(row_vals) + " |\n"
            
    return md


def generate_terraform_data(summary: str, results_data, url: str) -> str:
    """Convert extracted results into Terraform HCL (.tf) configuration format."""
    clean_summary = summary.replace('"', '\\"').replace('\n', ' ')
    tf = f'# Terraform HCL Configuration Generated from Web Scrape\n'
    tf += f'# Source URL: {url}\n'
    tf += f'# Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n'
    tf += f'locals {{\n'
    tf += f'  scrape_summary = "{clean_summary}"\n\n'
    
    if isinstance(results_data, dict):
        tf += f'  extracted_data = {{\n'
        for k, v in results_data.items():
            clean_k = str(k).replace('"', '\\"').replace('\n', ' ')
            clean_v = str(v).replace('"', '\\"').replace('\n', ' ')
            tf += f'    "{clean_k}" = "{clean_v}"\n'
        tf += f'  }}\n'
    elif isinstance(results_data, list):
        tf += f'  extracted_data = [\n'
        for row in results_data:
            tf += f'    {{\n'
            for k, v in row.items():
                clean_k = str(k).replace('"', '\\"').replace('\n', ' ')
                clean_v = str(v).replace('"', '\\"').replace('\n', ' ')
                tf += f'      "{clean_k}" = "{clean_v}"\n'
            tf += f'    }},\n'
        tf += f'  ]\n'
        
    tf += f'}}\n'
    return tf


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
        options=["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.0-flash", "gemini-3.5-flash"],
        index=0,
        help="gemini-flash-latest resolves to the latest fast Flash model."
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
    st.sidebar.info("💡 **Export Formats**: CSV, JSON, Text, Markdown, and Terraform (.tf).")

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
            else:
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
                            record_id = save_scrape_record(
                                url=target_url,
                                mode="Direct Scrape",
                                raw_text=raw_text,
                                summary=f"Direct text scrape of {target_url}"
                            )
                            st.session_state.current_scrape = {
                                "mode": "Direct Scrape",
                                "raw_text": raw_text,
                                "target_url": target_url,
                                "timestamp": timestamp,
                                "record_id": record_id
                            }
                        except Exception as e:
                            st.error(f"Scraping Error: {str(e)}")

                elif scrape_mode == "Agentic Scrape":
                    if not prompt.strip():
                        st.warning("Please provide an Intent Prompt for Agentic Scrape.")
                    elif not effective_api_key:
                        st.error("Gemini API Key is missing. Please set `GEMINI_API_KEY` in your `.env` file or enter it in the sidebar.")
                    else:
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
                                result_dict = result.to_dict()
                                summary = result.summary
                                results = result.results
                                record_id = save_scrape_record(
                                    url=target_url,
                                    mode="Agentic Scrape",
                                    prompt=prompt,
                                    summary=summary,
                                    results=results
                                )
                                st.session_state.current_scrape = {
                                    "mode": "Agentic Scrape",
                                    "result_dict": result_dict,
                                    "summary": summary,
                                    "results": results,
                                    "target_url": target_url,
                                    "timestamp": timestamp,
                                    "record_id": record_id
                                }
                            except Exception as e:
                                st.error(f"Agentic Scraping Error: {str(e)}")

        if "current_scrape" in st.session_state:
            scrape_data = st.session_state.current_scrape
            
            if scrape_data["mode"] == "Direct Scrape":
                st.success("Direct scrape completed successfully!")
                st.caption(f"💾 Saved record to Database (ID: `{scrape_data['record_id']}`)")
                st.subheader("📄 Raw Extracted Text")
                raw_text = scrape_data['raw_text']
                target_url = scrape_data['target_url']
                timestamp = scrape_data['timestamp']
                st.code(raw_text[:2000] + ("\n... [truncated for display]" if len(raw_text) > 2000 else ""), language="text")
                st.markdown("---")
                st.subheader("💾 Export Options")
                format_type = st.selectbox(
                    "Select Export Format:",
                    options=["Text (.txt)", "Markdown (.md)", "JSON (.json)", "CSV (.csv)", "Terraform (.tf)"],
                    key="direct_format_select"
                )
                if format_type == "Text (.txt)":
                    st.download_button("📥 Download Text File", data=raw_text, file_name=f"direct_{timestamp}.txt", mime="text/plain")
                elif format_type == "Markdown (.md)":
                    md_str = f"# Direct Scrape Output\n\n**URL:** [{target_url}]({target_url})\n\n```text\n{raw_text}\n```"
                    st.download_button("📝 Download Markdown File", data=md_str, file_name=f"direct_{timestamp}.md", mime="text/markdown")
                elif format_type == "JSON (.json)":
                    json_str = json.dumps({"url": target_url, "raw_text": raw_text}, indent=2)
                    st.download_button("📥 Download JSON File", data=json_str, file_name=f"direct_{timestamp}.json", mime="application/json")
                elif format_type == "CSV (.csv)":
                    csv_str = generate_csv_data({"raw_text": raw_text[:5000]})
                    st.download_button("📊 Download CSV File", data=csv_str, file_name=f"direct_{timestamp}.csv", mime="text/csv")
                elif format_type == "Terraform (.tf)":
                    tf_str = generate_terraform_data(f"Direct Scrape of {target_url}", {"raw_text_snippet": raw_text[:500]}, target_url)
                    st.download_button("🏗️ Download Terraform File", data=tf_str, file_name=f"direct_{timestamp}.tf", mime="text/plain")

            elif scrape_data["mode"] == "Agentic Scrape":
                st.success("Agentic scrape completed successfully!")
                st.caption(f"💾 Saved record to Database (ID: `{scrape_data['record_id']}`)")
                
                result_dict = scrape_data["result_dict"]
                target_url = scrape_data["target_url"]
                timestamp = scrape_data["timestamp"]
                summary = scrape_data["summary"]
                results = scrape_data["results"]

                st.subheader("📊 Structured JSON Result")
                st.json(result_dict)

                with st.expander("📝 Summary", expanded=True):
                    st.write(summary)

                json_data = json.dumps(result_dict, indent=2)
                csv_data = generate_csv_data(results)
                md_data = generate_markdown_data(summary, results, target_url)
                tf_data = generate_terraform_data(summary, results, target_url)
                txt_data = f"SUMMARY:\n{summary}\n\nEXTRACTED DATA:\n{json_data}"

                st.markdown("---")
                st.subheader("💾 Export Data")
                
                sel_col1, sel_col2 = st.columns([1, 1])
                with sel_col1:
                    export_format = st.selectbox(
                        "Choose Download Format:",
                        options=["CSV Spreadsheet (.csv)", "JSON (.json)", "Text Summary (.txt)", "Markdown Report (.md)", "Terraform (.tf)"],
                        index=0
                    )
                with sel_col2:
                    st.write("")
                    st.write("")
                    if export_format == "CSV Spreadsheet (.csv)":
                        st.download_button("📊 Download CSV File", data=csv_data, file_name=f"scrape_{timestamp}.csv", mime="text/csv", use_container_width=True)
                    elif export_format == "JSON (.json)":
                        st.download_button("📥 Download JSON File", data=json_data, file_name=f"scrape_{timestamp}.json", mime="application/json", use_container_width=True)
                    elif export_format == "Text Summary (.txt)":
                        st.download_button("📄 Download Text File", data=txt_data, file_name=f"scrape_{timestamp}.txt", mime="text/plain", use_container_width=True)
                    elif export_format == "Markdown Report (.md)":
                        st.download_button("📝 Download Markdown File", data=md_data, file_name=f"scrape_{timestamp}.md", mime="text/markdown", use_container_width=True)
                    elif export_format == "Terraform (.tf)":
                        st.download_button("🏗️ Download Terraform File", data=tf_data, file_name=f"scrape_{timestamp}.tf", mime="text/plain", use_container_width=True)

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
                        
                        rec_json = json.dumps(results, indent=2)
                        rec_csv = generate_csv_data(results)
                        rec_md = generate_markdown_data(summary, results, url)
                        rec_tf = generate_terraform_data(summary, results, url)
                        rec_txt = f"SUMMARY:\n{summary}\n\nDATA:\n{rec_json}"

                        h_fmt = st.selectbox(
                            f"Export Format for Record #{rec_id}:",
                            options=["CSV (.csv)", "JSON (.json)", "Text (.txt)", "Markdown (.md)", "Terraform (.tf)"],
                            key=f"fmt_sel_{rec_id}"
                        )

                        if h_fmt == "CSV (.csv)":
                            st.download_button(f"📊 Download CSV (Record #{rec_id})", data=rec_csv, file_name=f"record_{rec_id}.csv", mime="text/csv", key=f"dl_csv_{rec_id}")
                        elif h_fmt == "JSON (.json)":
                            st.download_button(f"📥 Download JSON (Record #{rec_id})", data=rec_json, file_name=f"record_{rec_id}.json", mime="application/json", key=f"dl_json_{rec_id}")
                        elif h_fmt == "Text (.txt)":
                            st.download_button(f"📄 Download Text (Record #{rec_id})", data=rec_txt, file_name=f"record_{rec_id}.txt", mime="text/plain", key=f"dl_txt_{rec_id}")
                        elif h_fmt == "Markdown (.md)":
                            st.download_button(f"📝 Download Markdown (Record #{rec_id})", data=rec_md, file_name=f"record_{rec_id}.md", mime="text/markdown", key=f"dl_md_{rec_id}")
                        elif h_fmt == "Terraform (.tf)":
                            st.download_button(f"🏗️ Download Terraform (Record #{rec_id})", data=rec_tf, file_name=f"record_{rec_id}.tf", mime="text/plain", key=f"dl_tf_{rec_id}")


if __name__ == "__main__":
    main()
