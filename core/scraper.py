import os
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from .engine import BrowserEngine, EngineConfig


class ExtractedItem(BaseModel):
    """Individual extracted key-value pair, compatible with Gemini schema constraints."""
    key: str = Field(description="Name or label of the extracted data field")
    value: str = Field(description="Extracted value or text content for this field")


class AgenticScrapeResult(BaseModel):
    """Strict Pydantic model for structured LLM extraction output (Gemini Developer API compliant)."""
    summary: str = Field(description="Summary of the extracted information or findings")
    extracted_data: List[ExtractedItem] = Field(
        default_factory=list, 
        description="List of key-value data fields extracted from the page text"
    )

    @property
    def results(self) -> Dict[str, str]:
        """Convert extracted items list to a standard dictionary."""
        return {item.key: item.value for item in self.extracted_data}

    def to_dict(self) -> Dict[str, Any]:
        """Return clean dictionary representation with summary and results dictionary."""
        return {
            "summary": self.summary,
            "results": self.results
        }


class ModularScraper:
    """Core extraction router supporting Direct and Agentic modes."""

    def __init__(self, config: Optional[EngineConfig] = None):
        self.config = config or EngineConfig()

    async def run_direct_scrape(self, url: str) -> str:
        """Mode 1: Direct Scrape.
        Opens URL with headless browser engine using domcontentloaded and fault-tolerant extraction.
        """
        engine = BrowserEngine(self.config)
        try:
            context = await engine.start()
            page = await context.new_page()
            
            # Step 1: Navigate with domcontentloaded for fast load
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            except Exception:
                # Step 2: Fallback to commit state if domcontentloaded times out
                try:
                    await page.goto(url, wait_until="commit", timeout=10000)
                except Exception:
                    pass

            # Step 3: Wait up to 3s for body to be present
            try:
                await page.wait_for_selector("body", timeout=5000)
            except Exception:
                pass

            # Step 4: Extract document.body.innerText
            raw_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
            return raw_text or ""
        finally:
            await engine.close()

    async def run_agentic_scrape(
        self, 
        url: str, 
        prompt: str, 
        gemini_api_key: Optional[str] = None,
        model_name: str = "gemini-2.5-pro"
    ) -> AgenticScrapeResult:
        """Mode 2: Agentic Scrape via Gemini Pro.
        Performs direct scrape to obtain page text, then uses Google Gemini Pro to extract structured data.
        """
        # Step 1: Extract page content via direct scrape
        raw_text = await self.run_direct_scrape(url)
        
        # Determine API Key from argument or environment
        api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key must be provided or set in the GEMINI_API_KEY environment variable.")
        
        client = genai.Client(api_key=api_key)
        
        # Truncate text if excessively long to stay within context limits
        max_chars = 100000
        truncated_text = raw_text[:max_chars] if len(raw_text) > max_chars else raw_text

        contents = f"Extraction Instructions:\n{prompt}\n\nWeb Page Text Content:\n{truncated_text}"

        # Step 2: Extract structured output via Gemini Pro with Gemini-compliant Pydantic schema
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert web scraping and data extraction assistant. "
                    "Analyze the provided web page text and extract the requested information into structured key-value items. "
                    "Provide a concise summary and list of extracted key-value data."
                ),
                response_mime_type="application/json",
                response_schema=AgenticScrapeResult,
            ),
        )

        if not response.text:
            raise RuntimeError("Empty response received from Gemini API.")
            
        return AgenticScrapeResult.model_validate_json(response.text)
