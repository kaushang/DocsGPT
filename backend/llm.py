from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


SYSTEM_PROMPT = """
You are a helpful assistant that answers questions strictly using the provided webpage content.

Rules:
1) Only use information found in the provided page content.
2) If the answer is not in the content, reply exactly: "Sorry, I don't know."
3) Keep answers concise but clear. Use bullet points when useful.
4) Do not invent facts or external details.
"""


def _make_llm() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env.")

    return ChatGoogleGenerativeAI(
        # 2.5 Flash is generally available on the free tier.
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.2,
    )


def _chunk_to_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "".join(parts)
    return ""


async def stream_answer(page_text: str, question: str, history: list[dict[str, str]]):
    llm = _make_llm()

    clipped_page_text = page_text[:40000]
    messages = [
        SystemMessage(content=SYSTEM_PROMPT.strip()),
        SystemMessage(
            content=f"Webpage content:\n\n{clipped_page_text}",
        ),
    ]

    for item in history[-8:]:
        if item["role"] == "user":
            messages.append(HumanMessage(content=item["content"]))
        elif item["role"] == "assistant":
            messages.append(AIMessage(content=item["content"]))

    messages.append(HumanMessage(content=question))

    async for chunk in llm.astream(messages):
        text = _chunk_to_text(getattr(chunk, "content", ""))
        if text:
            yield text
