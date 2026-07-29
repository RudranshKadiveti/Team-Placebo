import asyncio
import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv

project_root = Path(r"C:\Users\saisu\.gemini\antigravity\scratch\web_scraper_microservice")
sys.path.insert(0, str(project_root))
load_dotenv(project_root / ".env")

from core.engine import EngineConfig
from core.scraper import ModularScraper
from core.db import save_scrape_record

async def main():
    url = "https://www.amazon.in/s?k=iphone+17+pro+max+256gb&i=shoes&crid=2GDIC5LGXMHCC&sprefix=iphone%2Cshoes%2C289&ref=nb_sb_ss_mvt-t11-ranker_1_6"
    prompt = "Extract all product titles, prices, ratings, and key search results mentioned on the page."
    
    print(f"Scraping target URL: {url}")
    config = EngineConfig(headless=True)
    scraper = ModularScraper(config)
    
    result = await scraper.run_agentic_scrape(
        url=url,
        prompt=prompt,
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        model_name="gemini-flash-latest"
    )
    
    res_dict = result.to_dict()
    
    output_file = project_root / "storage" / "test_output.json"
    output_file.write_text(json.dumps(res_dict, indent=2), encoding="utf-8")
    
    print("--- SUCCESS ---")
    print("Summary:", result.summary)
    print("Results Output File:", output_file)

if __name__ == "__main__":
    asyncio.run(main())
