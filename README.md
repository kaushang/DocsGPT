# DocsGPT

Upload a `.pdf` or `.txt` document and chat with an AI assistant grounded in that document's content.

This project uses a FastAPI backend for document ingestion + retrieval and a React frontend for the chat interface.

## Features

- Upload `.pdf` and `.txt` files from the UI
- Automatic chunking and vector storage per document session
- Ask follow-up questions against the uploaded document context
- Simple chat interface with markdown-friendly assistant responses

## Tech Stack

- Backend: Python, FastAPI, LangChain, ChromaDB, Sentence Transformers, Google Gemini
- Frontend: React (Vite), Tailwind CSS

## Project Structure

- `backend/` - API, document parsing, chunking, retrieval, and answer generation
- `frontend/` - upload flow and chat UI

## Local Development

### 1) Backend setup

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set your Gemini key in `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Run the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend setup

From `frontend/`:

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## API Endpoints

- `GET /health`
  - Health check endpoint
- `POST /upload-document`
  - Form-data: `file` (`.pdf` or `.txt`)
  - Returns: `session_id`, `filename`, `chunks_created`, status message
- `POST /chat`
  - JSON body: `{ "session_id": "<id>", "message": "your question" }`
  - Returns: `{ "answer": "..." }`

## Environment Variables

### Backend (`backend/.env`)

- `GEMINI_API_KEY` (required)
- `CORS_ALLOWED_ORIGINS` (optional, default `*`; use comma-separated origins in production)

### Frontend (`frontend/.env`)

- `VITE_API_URL` (optional, default `http://localhost:8000`)

## Production Notes

- Set strict `CORS_ALLOWED_ORIGINS` in production (avoid `*`)
- Point frontend `VITE_API_URL` to your deployed backend URL
- Build frontend with `npm run build` (output: `frontend/dist/`)
- Run backend with a process manager (for example `uvicorn`/`gunicorn` under a supervisor or container)
