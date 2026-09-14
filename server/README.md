# Multi-LLM Custom ChatGPT FastAPI Backend (Project 1)

Production-ready FastAPI backend orchestrating parallel LLM queries across **OpenAI (GPT-4o-mini)**, **Anthropic Claude (Claude 3.5 Sonnet)**, and **Google Gemini (Gemini 1.5 Flash)** with session memory, smart simulation mode, and fault-tolerant async execution.

---

## Quick Start Guide

### 1. Activate the Virtual Environment

**Windows PowerShell**:
```powershell
.venv\Scripts\Activate.ps1
```

### 2. Run the Automated Test Suite

To verify that all endpoints, schema validation, and conversation histories are operating properly:
```powershell
.venv\Scripts\python -m pytest tests/ -v
```

### 3. Start the FastAPI Server

Launch the backend server with hot-reload enabled:
```powershell
.venv\Scripts\python run.py
```
Or directly using Uvicorn:
```powershell
.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Root Health Status**: [http://localhost:8000/](http://localhost:8000/)

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns service health status, configured models, and active providers |
| `POST` | `/chat` | Dispatches user message in parallel to OpenAI, Claude, and Gemini with isolated error handling |
| `POST` | `/continue` | Continues multi-turn conversation with a specific chosen model |
| `GET` | `/history/{session_id}` | Retrieves full or provider-filtered conversation history for a session |

---

## Demo / Simulation Mode vs. Live API Keys

By default, `DEMO_MODE=True` is enabled in `.env`. The backend produces realistic simulated responses so you can build, test, and integrate frontends immediately without paid API keys or hitting rate limits.

To enable live LLM calls, edit `.env`:
```env
DEMO_MODE=False
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
```
