import os
import sys
import asyncio
import re
import importlib
from pathlib import Path
from urllib.parse import urlparse
import streamlit as st
from dotenv import load_dotenv

# Ensure project root directory is in sys.path for clean imports
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import core modules with force-reload to ensure changes take effect without full server restart
import core.engine
import core.scraper
importlib.reload(core.engine)
importlib.reload(core.scraper)

from core import EngineConfig, ModularScraper

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
        margin-bottom: 2rem;
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


def main():
    st.markdown('<div class="main-header">Modular Scraping Microservice</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Decoupled Playwright Engine & Gemini Agentic Extraction</div>', unsafe_allow_html=True)

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
    st.sidebar.info("💡 **Decoupled Architecture**: This UI never touches Playwright directly. All browser automation is handled by `core.engine`.")

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

        if scrape_mode == "Direct Scrape":
            with st.spinner("⏳ Running Direct Scrape via Headless Engine..."):
                try:
                    raw_text = run_async_task(scraper.run_direct_scrape(target_url))
                    st.success("Direct scrape completed successfully!")
                    
                    st.subheader("📄 Raw Extracted Text")
                    st.code(raw_text, language="text")
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
                    
                    st.subheader("📊 Structured JSON Result")
                    st.json(result.to_dict())

                    with st.expander("📝 Summary", expanded=True):
                        st.write(result.summary)
                except Exception as e:
                    st.error(f"Agentic Scraping Error: {str(e)}")


if __name__ == "__main__":
    main()
