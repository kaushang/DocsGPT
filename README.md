# WebMind Chat

Chat with the content of any public webpage.

Paste a URL, load the page, and ask follow-up questions grounded in that page's text.

## Tech Stack

- Backend: Python, FastAPI, LangChain, Google Gemini, BeautifulSoup4, httpx
- Frontend: React (Vite), Tailwind CSS

## Project Structure

- `backend/` - API, scraping, LLM integration
- `frontend/` - chat UI and streaming client

## Local Development

### 1) Backend

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set `GEMINI_API_KEY` in `.env`.

Run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

From `frontend/`:

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Production Notes

- Configure `backend/.env`:
  - `GEMINI_API_KEY=<your_key>`
  - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- Configure `frontend/.env`:
  - `VITE_API_URL=https://your-backend-domain.com`
- Run frontend build:
  - `npm run build` (outputs to `frontend/dist/`)
- Run backend with a process manager (for example `gunicorn` or `uvicorn` under systemd/container).

## API Endpoints

- `POST /load-url`
  - Body: `{ "url": "https://example.com/article" }`
  - Returns session id + page title
- `POST /chat`
  - Body: `{ "session_id": "<id>", "message": "question" }`
  - Streams NDJSON chunks (`token`, `error`, `done`)

## Environment Variables

### Backend (`backend/.env`)

- `GEMINI_API_KEY` (required)
- `CORS_ALLOWED_ORIGINS` (optional, comma-separated list)

### Frontend (`frontend/.env`)

- `VITE_API_URL` (optional, defaults to `http://localhost:8000`)
