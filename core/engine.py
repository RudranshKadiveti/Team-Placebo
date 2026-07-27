import os
from typing import Optional
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright, Playwright, Browser, BrowserContext

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class EngineConfig(BaseModel):
    headless: bool = Field(default=True, description="Run browser in headless mode")
    proxy_server: Optional[str] = Field(default=None, description="Proxy server URL (e.g. http://user:pass@proxy.example.com:8080)")
    user_agent: Optional[str] = Field(default=None, description="Custom User-Agent string")
    storage_state_path: Optional[str] = Field(default=None, description="Path to storage state file for persistent session/cookies")
    use_stealth: bool = Field(default=False, description="Enable stealth evasion techniques")


class BrowserEngine:
    """Headless browser engine manager wrapping Playwright async API."""

    def __init__(self, config: Optional[EngineConfig] = None):
        self.config = config or EngineConfig()
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    async def start(self) -> BrowserContext:
        """Initialize async Playwright, launch Chromium browser, and return a BrowserContext."""
        self.playwright = await async_playwright().start()

        launch_kwargs = {
            "headless": self.config.headless,
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        }
        if self.config.proxy_server:
            launch_kwargs["proxy"] = {"server": self.config.proxy_server}

        self.browser = await self.playwright.chromium.launch(**launch_kwargs)

        context_kwargs = {
            "user_agent": self.config.user_agent or DEFAULT_USER_AGENT,
            "viewport": {"width": 1920, "height": 1080},
            "locale": "en-US",
            "accept_downloads": True,
        }

        if self.config.storage_state_path and os.path.exists(self.config.storage_state_path):
            context_kwargs["storage_state"] = self.config.storage_state_path

        self.context = await self.browser.new_context(**context_kwargs)
        
        # Enable extra stealth evasions on pages
        await self.context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        )
        
        return self.context

    async def close(self) -> None:
        """Gracefully close browser context, browser instance, and stop Playwright."""
        if self.context:
            await self.context.close()
            self.context = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
