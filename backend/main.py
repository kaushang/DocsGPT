from __future__ import annotations

import json
import logging
import os
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl

from llm import stream_answer
from scraper import ScrapeError, fetch_page_content

app = FastAPI(title="WebMind API")
logger = logging.getLogger(__name__)


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "*")
    if raw.strip() == "*":
        return ["*"]
    return [item.strip() for item in raw.split(",") if item.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, dict] = {}


class LoadUrlRequest(BaseModel):
    url: HttpUrl


class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/load-url")
async def load_url(payload: LoadUrlRequest):
    try:
        page = await fetch_page_content(str(payload.url))
    except ScrapeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session_id = str(uuid4())
    sessions[session_id] = {
        "url": str(payload.url),
        "title": page["title"],
        "content": page["content"],
        "history": [],
    }

    return {
        "session_id": session_id,
        "title": page["title"],
        "message": "Page loaded successfully.",
    }


@app.post("/chat")
async def chat(payload: ChatRequest):
    session = sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Load a URL first.")

    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session["history"].append({"role": "user", "content": question})

    async def event_stream():
        answer_parts: list[str] = []
        try:
            async for token in stream_answer(session["content"], question, session["history"]):
                answer_parts.append(token)
                yield json.dumps({"type": "token", "value": token}) + "\n"
        except Exception as exc:
            logger.exception("Chat generation failed")
            yield json.dumps({"type": "error", "value": f"Failed to generate response: {exc}"}) + "\n"
            return

        full_answer = "".join(answer_parts).strip() or "I don't know."
        session["history"].append({"role": "assistant", "content": full_answer})
        yield json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
