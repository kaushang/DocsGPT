from __future__ import annotations

import os
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import (
    chunk_and_store,
    extract_text_from_pdf,
    extract_text_from_txt,
    has_session,
    retrieve_and_answer,
)

app = FastAPI(title="DocsGPT API")


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

class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please upload a valid .pdf or .txt file.")

    filename = file.filename
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if extension not in {"pdf", "txt"}:
        raise HTTPException(status_code=400, detail="Only .pdf and .txt files are supported.")

    file_bytes = await file.read()
    session_id = str(uuid4())
    if extension == "pdf":
        extracted_text = extract_text_from_pdf(file_bytes)
    else:
        extracted_text = extract_text_from_txt(file_bytes)

    if len(extracted_text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Could not extract readable text from this file")

    chunks_created = chunk_and_store(extracted_text, session_id)
    if chunks_created == 0:
        raise HTTPException(status_code=400, detail="Could not extract readable text from this file")

    return {
        "session_id": session_id,
        "filename": filename,
        "chunks_created": chunks_created,
        "message": "Document loaded successfully",
    }


@app.post("/chat")
async def chat(payload: ChatRequest):
    if not has_session(payload.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload a document first.")

    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        answer = retrieve_and_answer(question, payload.session_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {exc}") from exc

    return {"answer": answer}
