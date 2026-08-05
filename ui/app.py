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
import core.resume_parser

importlib.reload(core.engine)
importlib.reload(core.scraper)
importlib.reload(core.db)
importlib.reload(core.resume_parser)

from core.engine import EngineConfig, BrowserEngine
from core.scraper import ModularScraper, AgenticScrapeResult
from core.resume_parser import ResumeParser, ResumeParseResult, extract_text_from_document
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
    page_title="Web & Resume Scraping Microservice",
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
    .skill-chip {
        display: inline-block;
        background-color: #3b82f6;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.85rem;
        margin: 2px 4px 2px 0px;
        font-weight: 500;
    }
    .candidate-card {
        background: #1e293b;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #334155;
        margin-bottom: 1.5rem;
    }
    .ats-score-box {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
        font-size: 1.5rem;
        font-weight: bold;
    }
    </style>
""", unsafe_allow_html=True)


def clean_and_validate_url(raw_input: str) -> tuple[str, bool]:
    """Extract and validate clean URL from user input string."""
    text = raw_input.strip()
    if not text:
        return "", False
    
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
        if isinstance(val, (dict, list)):
            val = json.dumps(val)
        writer.writerow([key, str(val)])
    return output.getvalue()


def generate_plain_text_output(summary: str, results_dict: dict) -> str:
    """Format summary and extracted dictionary into a clean human-readable plain text block."""
    txt = f"EXECUTIVE SUMMARY:\n{summary}\n\n"
    txt += "EXTRACTED DATA FIELDS:\n"
    txt += "=" * 40 + "\n"
    for k, v in results_dict.items():
        if isinstance(v, (dict, list)):
            v_str = json.dumps(v, indent=2)
        else:
            v_str = str(v)
        txt += f"• {k}: {v_str}\n"
    return txt


def generate_markdown_data(summary: str, results_dict: dict, url_or_filename: str) -> str:
    """Convert extracted results into clean Markdown document format."""
    md = f"# Extraction Report\n\n"
    md += f"**Source / File:** [{url_or_filename}]({url_or_filename})\n"
    md += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    md += f"## Executive Summary\n\n{summary}\n\n"
    md += f"## Extracted Data Results\n\n"
    md += f"| Field / Attribute | Value |\n"
    md += f"| :--- | :--- |\n"
    for k, v in results_dict.items():
        clean_k = str(k).replace("|", "\\|")
        if isinstance(v, (dict, list)):
            clean_v = json.dumps(v).replace("|", "\\|")
        else:
            clean_v = str(v).replace("|", "\\|").replace("\n", " ")
        md += f"| **{clean_k}** | {clean_v} |\n"
    return md


def generate_terraform_data(summary: str, results_dict: dict, url_or_filename: str) -> str:
    """Convert extracted results into Terraform HCL (.tf) configuration format."""
    clean_summary = summary.replace('"', '\\"').replace('\n', ' ')
    tf = f'# Terraform HCL Configuration Generated from Extraction Microservice\n'
    tf += f'# Source: {url_or_filename}\n'
    tf += f'# Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n'
    tf += f'locals {{\n'
    tf += f'  extraction_summary = "{clean_summary}"\n\n'
    tf += f'  extracted_data = {{\n'
    for k, v in results_dict.items():
        clean_k = str(k).replace('"', '\\"').replace('\n', ' ')
        if isinstance(v, (dict, list)):
            clean_v = json.dumps(v).replace('"', '\\"').replace('\n', ' ')
        else:
            clean_v = str(v).replace('"', '\\"').replace('\n', ' ')
        tf += f'    "{clean_k}" = "{clean_v}"\n'
    tf += f'  }}\n'
    tf += f'}}\n'
    return tf


def main():
    st.markdown('<div class="main-header">Modular Scraping & Resume Parsing Microservice</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Decoupled Playwright Engine, Gemini AI Resume Parser & Database Persistence</div>', unsafe_allow_html=True)

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
    st.sidebar.info("💡 **Export Formats**: JSON, Text, CSV, Markdown, and Terraform (.tf).")

    # Tabs for Web Scrape, Resume Parser, and Database History
    tab_scrape, tab_resume, tab_history = st.tabs(["🚀 Web Scrape", "📄 Resume / CV Parser", "📜 Database & History"])

    # TAB 1: WEB SCRAPE
    with tab_scrape:
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
                        
                        record_id = save_scrape_record(
                            url=target_url,
                            mode="Direct Scrape",
                            raw_text=raw_text,
                            summary=f"Direct text scrape of {target_url}"
                        )
                        st.caption(f"💾 Saved record to Database (ID: `{record_id}`)")

                        st.subheader("📄 Raw Extracted Text")
                        st.code(raw_text[:2000] + ("\n... [truncated for display]" if len(raw_text) > 2000 else ""), language="text")

                        st.markdown("---")
                        st.subheader("💾 Export Options")
                        
                        format_type = st.selectbox(
                            "Select Export Format:",
                            options=["Text (.txt)", "JSON (.json)", "Markdown (.md)", "CSV (.csv)", "Terraform (.tf)"],
                            key="direct_format_select"
                        )
                        
                        if format_type == "Text (.txt)":
                            st.download_button("📥 Download Text File", data=raw_text, file_name=f"direct_{timestamp}.txt", mime="text/plain")
                        elif format_type == "JSON (.json)":
                            json_str = json.dumps({"url": target_url, "raw_text": raw_text}, indent=2)
                            st.download_button("📥 Download JSON File", data=json_str, file_name=f"direct_{timestamp}.json", mime="application/json")
                        elif format_type == "Markdown (.md)":
                            md_str = f"# Direct Scrape Output\n\n**URL:** [{target_url}]({target_url})\n\n```text\n{raw_text}\n```"
                            st.download_button("📝 Download Markdown File", data=md_str, file_name=f"direct_{timestamp}.md", mime="text/markdown")
                        elif format_type == "CSV (.csv)":
                            csv_str = generate_csv_data({"raw_text": raw_text[:5000]})
                            st.download_button("📊 Download CSV File", data=csv_str, file_name=f"direct_{timestamp}.csv", mime="text/csv")
                        elif format_type == "Terraform (.tf)":
                            tf_str = generate_terraform_data(f"Direct Scrape of {target_url}", {"raw_text_snippet": raw_text[:500]}, target_url)
                            st.download_button("🏗️ Download Terraform File", data=tf_str, file_name=f"direct_{timestamp}.tf", mime="text/plain")

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
                        
                        record_id = save_scrape_record(
                            url=target_url,
                            mode="Agentic Scrape",
                            prompt=prompt,
                            summary=result.summary,
                            results=result_dict.get("results", {})
                        )
                        st.caption(f"💾 Saved record to Database (ID: `{record_id}`)")

                        st.subheader("📊 Extraction Output")
                        out_tab_json, out_tab_text = st.tabs(["JSON Format", "Plain Text Format"])
                        
                        with out_tab_json:
                            st.json(result_dict)
                        
                        with out_tab_text:
                            formatted_text_output = generate_plain_text_output(result.summary, result_dict.get("results", {}))
                            st.code(formatted_text_output, language="text")

                        with st.expander("📝 Executive Summary", expanded=True):
                            st.write(result.summary)

                        json_data = json.dumps(result_dict, indent=2)
                        csv_data = generate_csv_data(result.results)
                        md_data = generate_markdown_data(result.summary, result.results, target_url)
                        tf_data = generate_terraform_data(result.summary, result.results, target_url)
                        txt_data = generate_plain_text_output(result.summary, result.results)

                        st.markdown("---")
                        st.subheader("💾 Export Data")
                        
                        sel_col1, sel_col2 = st.columns([1, 1])
                        with sel_col1:
                            export_format = st.selectbox(
                                "Choose Download Format:",
                                options=[
                                    "JSON (.json)", 
                                    "Text Summary (.txt)", 
                                    "CSV Spreadsheet (.csv)", 
                                    "Markdown Report (.md)", 
                                    "Terraform (.tf)"
                                ],
                                index=0
                            )
                        
                        with sel_col2:
                            st.write("")
                            st.write("")
                            if export_format == "JSON (.json)":
                                st.download_button("📥 Download JSON File", data=json_data, file_name=f"scrape_{timestamp}.json", mime="application/json", use_container_width=True)
                            elif export_format == "Text Summary (.txt)":
                                st.download_button("📄 Download Text File", data=txt_data, file_name=f"scrape_{timestamp}.txt", mime="text/plain", use_container_width=True)
                            elif export_format == "CSV Spreadsheet (.csv)":
                                st.download_button("📊 Download CSV File", data=csv_data, file_name=f"scrape_{timestamp}.csv", mime="text/csv", use_container_width=True)
                            elif export_format == "Markdown Report (.md)":
                                st.download_button("📝 Download Markdown File", data=md_data, file_name=f"scrape_{timestamp}.md", mime="text/markdown", use_container_width=True)
                            elif export_format == "Terraform (.tf)":
                                st.download_button("🏗️ Download Terraform File", data=tf_data, file_name=f"scrape_{timestamp}.tf", mime="text/plain", use_container_width=True)

                    except Exception as e:
                        st.error(f"Agentic Scraping Error: {str(e)}")

    # TAB 2: RESUME / CV PARSER
    with tab_resume:
        st.subheader("📄 AI-Powered Resume & CV Parser")
        st.write("Upload any candidate Resume or CV document (**PDF, DOCX, or TXT**) for standardized JSON schema extraction & ATS analysis.")

        col_r1, col_r2 = st.columns([2, 1])
        
        with col_r1:
            uploaded_file = st.file_uploader(
                "Upload Resume / CV File", 
                type=["pdf", "docx", "txt"],
                help="Supports PDF, Microsoft Word (.docx), and Plain Text files."
            )
        
        with col_r2:
            custom_instructions = st.text_area(
                "Special Focus Instructions (Optional)",
                placeholder="e.g., Highlight Python skills, years of experience, and cloud certifications.",
                height=110
            )

        parse_button = st.button("⚡ Parse Resume with Gemini AI", use_container_width=False)

        if parse_button:
            if not uploaded_file:
                st.error("Please upload a PDF, DOCX, or TXT resume file to parse.")
            elif not effective_api_key:
                st.error("Gemini API Key is missing. Please set `GEMINI_API_KEY` in your `.env` file or enter it in the sidebar.")
            else:
                with st.spinner("🤖 Parsing Resume Document & Extracting Standardized Candidate Schema..."):
                    try:
                        file_bytes = uploaded_file.read()
                        parser = ResumeParser(api_key=effective_api_key)
                        
                        resume_result = run_async_task(
                            parser.parse_resume(
                                file_bytes=file_bytes,
                                filename=uploaded_file.name,
                                custom_instructions=custom_instructions,
                                model_name=gemini_model
                            )
                        )
                        
                        res_dict = resume_result.to_dict()
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

                        record_id = save_scrape_record(
                            url=uploaded_file.name,
                            mode="Resume Scrape",
                            prompt=custom_instructions,
                            summary=resume_result.executive_summary or f"Parsed Resume for {resume_result.contact.name}",
                            results=res_dict
                        )
                        st.success(f"Resume parsed successfully! Saved to Database (ID: `{record_id}`). Confidence: `{resume_result.parser_confidence * 100:.0f}%`")

                        # ATS SCORE & CANDIDATE SUMMARY CARD
                        st.markdown("### 👤 Candidate Profile & ATS Analysis")
                        
                        ats_col, profile_col = st.columns([1, 3])
                        
                        with ats_col:
                            ats_score = resume_result.ats_analysis.ats_score
                            st.markdown(f"""
                            <div class="ats-score-box">
                                <div>ATS Score</div>
                                <div style="font-size: 2.8rem; margin: 0.5rem 0;">{ats_score}/100</div>
                            </div>
                            """, unsafe_allow_html=True)
                        
                        with profile_col:
                            st.markdown(f"""
                            <div class="candidate-card">
                                <h2 style="margin-top:0; color:#4285f4;">{resume_result.contact.name or 'Candidate Profile'}</h2>
                                <p><strong>📧 Email:</strong> {resume_result.contact.email or 'N/A'} | 
                                   <strong>📞 Phone:</strong> {resume_result.contact.phone or 'N/A'} | 
                                   <strong>📍 Location:</strong> {resume_result.contact.location or 'N/A'}</p>
                                <p>
                                    {f'<strong>🔗 LinkedIn:</strong> <a href="{resume_result.contact.linkedin}" target="_blank">{resume_result.contact.linkedin}</a> | ' if resume_result.contact.linkedin else ''}
                                    {f'<strong>💻 GitHub:</strong> <a href="{resume_result.contact.github}" target="_blank">{resume_result.contact.github}</a> | ' if resume_result.contact.github else ''}
                                    {f'<strong>🌐 Portfolio:</strong> <a href="{resume_result.contact.portfolio}" target="_blank">{resume_result.contact.portfolio}</a>' if resume_result.contact.portfolio else ''}
                                </p>
                                <hr style="border-color:#334155;">
                                <p><strong>Executive Summary:</strong> {resume_result.executive_summary or 'No summary provided.'}</p>
                            </div>
                            """, unsafe_allow_html=True)

                        # CATEGORIZED SKILLS CHIPS
                        st.markdown("#### 🛠️ Categorized Skills")
                        skills_obj = resume_result.skills
                        
                        sk_col1, sk_col2, sk_col3 = st.columns(3)
                        with sk_col1:
                            if skills_obj.programming_languages:
                                st.markdown("**Languages:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.programming_languages]), unsafe_allow_html=True)
                            if skills_obj.frameworks_libraries:
                                st.markdown("**Frameworks:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.frameworks_libraries]), unsafe_allow_html=True)
                        
                        with sk_col2:
                            if skills_obj.tools_platforms:
                                st.markdown("**Tools & Cloud:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.tools_platforms]), unsafe_allow_html=True)
                            if skills_obj.domain_knowledge:
                                st.markdown("**Domain Knowledge:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.domain_knowledge]), unsafe_allow_html=True)
                        
                        with sk_col3:
                            if skills_obj.soft_skills:
                                st.markdown("**Soft Skills:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.soft_skills]), unsafe_allow_html=True)
                            if skills_obj.languages_spoken:
                                st.markdown("**Languages Spoken:**")
                                st.markdown("".join([f'<span class="skill-chip">{s}</span>' for s in skills_obj.languages_spoken]), unsafe_allow_html=True)

                        st.write("")

                        # DISPLAY DUAL JSON & TEXT OUTPUT TABS
                        st.markdown("---")
                        st.subheader("📊 Extraction Output (Strict JSON & Plain Text)")
                        res_tab_json, res_tab_text = st.tabs(["Strict JSON Format", "Plain Text Format"])
                        
                        with res_tab_json:
                            st.json(res_dict)
                        
                        with res_tab_text:
                            txt_resume_view = generate_plain_text_output(resume_result.executive_summary, res_dict)
                            st.code(txt_resume_view, language="text")

                        # Work Experience & Education Columns
                        col_exp, col_edu = st.columns(2)
                        
                        with col_exp:
                            st.markdown("#### 💼 Enriched Work Experience")
                            if resume_result.work_experience:
                                for exp in resume_result.work_experience:
                                    st.markdown(f"**{exp.job_title}** @ *{exp.company}* ({exp.start_date} - {exp.end_date})")
                                    if exp.location:
                                        st.caption(f"📍 {exp.location}")
                                    if exp.responsibilities:
                                        st.write("**Responsibilities:** " + "; ".join(exp.responsibilities))
                                    if exp.achievements:
                                        st.write("**Impact:** " + "; ".join(exp.achievements))
                                    if exp.technologies_used:
                                        st.write("**Tech:** " + ", ".join(exp.technologies_used))
                                    st.markdown("---")
                            else:
                                st.write("No work experience listed.")

                        with col_edu:
                            st.markdown("#### 🎓 Education & Certifications")
                            if resume_result.education:
                                for edu in resume_result.education:
                                    st.markdown(f"**{edu.degree}** - *{edu.field_of_study}*")
                                    st.write(f"*{edu.institution}* ({edu.start_date} - {edu.end_date})")
                                    if edu.gpa_or_grade:
                                        st.caption(f"GPA/Grade: {edu.gpa_or_grade}")
                                    st.markdown("---")
                            
                            if resume_result.certifications:
                                st.markdown("**📜 Certifications:**")
                                for cert in resume_result.certifications:
                                    st.write(f"- **{cert.title}** ({cert.issuing_organization}) - *{cert.issue_date}*")

                        # EXPORT FORMATS FOR RESUME
                        st.markdown("---")
                        st.subheader("💾 Export Parsed Resume Data")
                        
                        json_resume = json.dumps(res_dict, indent=2)
                        csv_resume = generate_csv_data(res_dict)
                        md_resume = generate_markdown_data(resume_result.executive_summary, res_dict, uploaded_file.name)
                        tf_resume = generate_terraform_data(resume_result.executive_summary, res_dict, uploaded_file.name)
                        txt_resume = generate_plain_text_output(resume_result.executive_summary, res_dict)

                        r_col1, r_col2 = st.columns([1, 1])
                        
                        with r_col1:
                            res_export_fmt = st.selectbox(
                                "Choose Download Format:",
                                options=[
                                    "JSON (.json)", 
                                    "Text Summary (.txt)", 
                                    "CSV Spreadsheet (.csv)", 
                                    "Markdown Report (.md)", 
                                    "Terraform (.tf)"
                                ],
                                key="res_export_select"
                            )
                        
                        with r_col2:
                            st.write("")
                            st.write("")
                            if res_export_fmt == "JSON (.json)":
                                st.download_button("📥 Download Resume JSON", data=json_resume, file_name=f"resume_{timestamp}.json", mime="application/json", use_container_width=True)
                            elif res_export_fmt == "Text Summary (.txt)":
                                st.download_button("📄 Download Resume TXT", data=txt_resume, file_name=f"resume_{timestamp}.txt", mime="text/plain", use_container_width=True)
                            elif res_export_fmt == "CSV Spreadsheet (.csv)":
                                st.download_button("📊 Download Resume CSV", data=csv_resume, file_name=f"resume_{timestamp}.csv", mime="text/csv", use_container_width=True)
                            elif res_export_fmt == "Markdown Report (.md)":
                                st.download_button("📝 Download Resume Markdown", data=md_resume, file_name=f"resume_{timestamp}.md", mime="text/markdown", use_container_width=True)
                            elif res_export_fmt == "Terraform (.tf)":
                                st.download_button("🏗️ Download Resume Terraform", data=tf_resume, file_name=f"resume_{timestamp}.tf", mime="text/plain", use_container_width=True)

                    except Exception as e:
                        st.error(f"Resume Parsing Error: {str(e)}")

    # TAB 3: DATABASE HISTORY
    with tab_history:
        st.subheader("📜 Stored Scrape & Resume Records")
        records = get_recent_scrapes(limit=50)

        if not records:
            st.info("No records found in database. Perform a web scrape or resume parse to store historical results!")
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
                    st.write(f"**Source/File:** {url}")
                    st.write(f"**Mode:** `{mode}`")
                    st.write(f"**Date:** `{created_at}`")
                    if rec.get("prompt"):
                        st.write(f"**Prompt/Instructions:** {rec['prompt']}")
                    
                    st.write(f"**Summary:** {summary}")

                    if results:
                        rec_out_json, rec_out_txt = st.tabs(["JSON Format", "Plain Text Format"])
                        
                        with rec_out_json:
                            st.json(results)
                        
                        with rec_out_txt:
                            rec_txt_view = generate_plain_text_output(summary, results)
                            st.code(rec_txt_view, language="text")

                        rec_json = json.dumps(results, indent=2)
                        rec_csv = generate_csv_data(results)
                        rec_md = generate_markdown_data(summary, results, url)
                        rec_tf = generate_terraform_data(summary, results, url)
                        rec_txt = generate_plain_text_output(summary, results)

                        h_fmt = st.selectbox(
                            f"Export Format for Record #{rec_id}:",
                            options=["JSON (.json)", "Text (.txt)", "CSV (.csv)", "Markdown (.md)", "Terraform (.tf)"],
                            key=f"fmt_sel_{rec_id}"
                        )

                        if h_fmt == "JSON (.json)":
                            st.download_button(f"📥 Download JSON (Record #{rec_id})", data=rec_json, file_name=f"record_{rec_id}.json", mime="application/json", key=f"dl_json_{rec_id}")
                        elif h_fmt == "Text (.txt)":
                            st.download_button(f"📄 Download Text (Record #{rec_id})", data=rec_txt, file_name=f"record_{rec_id}.txt", mime="text/plain", key=f"dl_txt_{rec_id}")
                        elif h_fmt == "CSV (.csv)":
                            st.download_button(f"📊 Download CSV (Record #{rec_id})", data=rec_csv, file_name=f"record_{rec_id}.csv", mime="text/csv", key=f"dl_csv_{rec_id}")
                        elif h_fmt == "Markdown (.md)":
                            st.download_button(f"📝 Download Markdown (Record #{rec_id})", data=rec_md, file_name=f"record_{rec_id}.md", mime="text/markdown", key=f"dl_md_{rec_id}")
                        elif h_fmt == "Terraform (.tf)":
                            st.download_button(f"🏗️ Download Terraform (Record #{rec_id})", data=rec_tf, file_name=f"record_{rec_id}.tf", mime="text/plain", key=f"dl_tf_{rec_id}")


if __name__ == "__main__":
    main()
