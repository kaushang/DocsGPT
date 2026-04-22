from __future__ import annotations

from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup


class ScrapeError(Exception):
    """Raised when a webpage cannot be fetched or parsed."""


def _validate_url(url: str) -> None:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ScrapeError("Please provide a valid public URL starting with http:// or https://")


async def fetch_page_content(url: str) -> dict[str, str]:
    _validate_url(url)

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
    }

    timeout = httpx.Timeout(20.0, connect=10.0)

    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise ScrapeError("Timed out while fetching this webpage.") from exc
    except httpx.HTTPStatusError as exc:
        raise ScrapeError(f"Could not load page (HTTP {exc.response.status_code}).") from exc
    except httpx.HTTPError as exc:
        raise ScrapeError("Failed to fetch this webpage. Please verify the URL is publicly accessible.") from exc

    content_type = response.headers.get("content-type", "").lower()
    if "text/html" not in content_type:
        raise ScrapeError("This URL does not appear to be an HTML webpage.")

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "noscript", "iframe", "svg"]):
        tag.decompose()

    title = (soup.title.string or "").strip() if soup.title else ""
    title = title or "Untitled Page"

    blocks = []
    for element in soup.select("h1, h2, h3, h4, p, li, blockquote, pre"):
        text = element.get_text(" ", strip=True)
        if text:
            blocks.append(text)

    text_content = "\n\n".join(blocks).strip()
    if not text_content:
        text_content = soup.get_text("\n", strip=True)

    if len(text_content) < 120:
        raise ScrapeError(
            "Could not extract enough readable text from this page. It may be blocked, paywalled, or script-heavy."
        )

    max_chars = 60000
    return {
        "title": title,
        "content": text_content[:max_chars],
    }
