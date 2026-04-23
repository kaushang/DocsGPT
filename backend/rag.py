from __future__ import annotations

import os
from typing import Optional

import chromadb
import fitz
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import SentenceTransformer

load_dotenv()

SYSTEM_PROMPT = """
You are a helpful document assistant. Answer the user's question based strictly and only on the context extracted from the uploaded document.

Rules:
- Only use information present in the provided context chunks
- If the answer is not found in the context, respond with exactly: "This information is not available in the uploaded document."
- Be concise and well-structured in your answers
- Use bullet points when listing multiple items
- Never use external knowledge or make up information

Context from document:
{context}

User Question:
{question}
"""


_chroma_client = chromadb.Client()
_embedding_model: Optional[SentenceTransformer] = None


def _get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _make_llm() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env.")

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.2,
    )


def extract_text_from_pdf(file_bytes: bytes) -> str:
    chunks: list[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text = page.get_text().strip()
            if text:
                chunks.append(text)
    return "\n\n".join(chunks).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def chunk_and_store(text: str, session_id: str) -> int:
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    text_chunks = [chunk.strip() for chunk in splitter.split_text(text) if chunk.strip()]
    if not text_chunks:
        return 0

    embedding_model = _get_embedding_model()
    embeddings = embedding_model.encode(text_chunks).tolist()

    collection = _chroma_client.get_or_create_collection(name=session_id)
    ids = [f"{session_id}-{idx}" for idx in range(len(text_chunks))]
    metadatas = [{"chunk_index": idx} for idx in range(len(text_chunks))]

    collection.add(ids=ids, documents=text_chunks, embeddings=embeddings, metadatas=metadatas)
    return len(text_chunks)


def has_session(session_id: str) -> bool:
    try:
        _chroma_client.get_collection(name=session_id)
        return True
    except Exception:
        return False


def retrieve_and_answer(question: str, session_id: str) -> str:
    collection = _chroma_client.get_collection(name=session_id)
    embedding_model = _get_embedding_model()

    question_embedding = embedding_model.encode([question]).tolist()[0]
    results = collection.query(query_embeddings=[question_embedding], n_results=4)
    documents = results.get("documents", [[]])
    top_chunks = documents[0] if documents else []
    context = "\n\n".join(top_chunks).strip()

    prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT.strip())
    chain = prompt | _make_llm() | StrOutputParser()
    return chain.invoke({"context": context, "question": question}).strip()
