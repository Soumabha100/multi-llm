# Backend Architecture Documentation (Server)

This document provides a comprehensive technical overview of the FastAPI backend architecture for the **Multi-LLM Custom ChatGPT Clone (Beta Version)**.

## 🏗 High-Level Architecture

The backend is constructed using **Python 3.10+** and the **FastAPI** framework, running on Uvicorn. It is designed to act as an orchestrator—receiving a single prompt from the React client, rapidly multiplexing that prompt across various third-party AI APIs (OpenAI, Claude, Gemini) in parallel, and streaming the responses back.

### Technology Stack
- **Framework**: FastAPI (Python)
- **Concurrency**: `asyncio` for parallel API execution
- **LLM Integrations**: 
  - Tokenharbor (Claude 3)
  - OpenRouter (GPT-3.5 / OpenAI)
  - Google Gemini (Gemini 3.6)
- **API Security**: CORS middleware and environment variables (`.env`)

---

## 🔑 API Keys & Configuration

The application interfaces with several external LLMs, which requires sensitive API keys. 
- Keys are loaded from a `.env` file using standard `python-dotenv` practices.
- **Reference**: Please copy `.env.example` to `.env` and fill in your keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).
- These keys are injected securely into the respective service modules located in `app/services/`.

---

## 🧠 Core Logic & Orchestration

The magic of querying multiple LLMs in parallel happens primarily in **`app/services/orchestrator.py`**.

### Parallel Execution (The Orchestrator)
When the `/api/chat/initial` endpoint is hit, the `orchestrator` takes the user's prompt and utilizes `asyncio.gather()` to spin up non-blocking, parallel API calls to `gemini_service`, `openrouter_service`, and `tokenharbor_service`. This guarantees that the user does not have to wait for the slowest model to finish before seeing responses from the fastest models.

### Service Layer (`app/services/`)
The `LLMManager` acts as an abstraction layer above individual AI providers.
Each provider has its own dedicated file (e.g., `gemini_service.py`) that extends a `BaseLLMService`. This ensures that even though OpenAI and Claude have different REST API structures, they are normalized into a standard response schema before being returned to the frontend.

---

## 🚦 API Routers

The application uses FastAPI's `APIRouter` to keep endpoints modular and organized within the `app/routers/` directory.

### 1. `chat.py` (Parallel Querying)
- **Route**: `POST /api/chat/initial`
- **Purpose**: This is the heart of the "Multi-LLM Comparison" feature. It takes the user's first prompt, passes it to the `orchestrator.py`, and returns a JSON dictionary containing the responses from *all* active LLMs. 

### 2. `continue_chat.py` (Single-Model Chat)
- **Route**: `POST /api/chat/continue`
- **Purpose**: Used after the user selects their preferred model. It takes the user's prompt and a specific `modelId` (e.g., `tokenharbor`). It bypasses the orchestrator and sends the prompt *only* to the selected model's service. It also passes along the `sessionId` so the Conversation Memory can inject past context.

### 3. `health.py`
- **Route**: `GET /api/health`
- **Purpose**: A basic liveness probe to verify the FastAPI server is running.

---

## 💭 Conversation Memory & Context

LLMs are inherently stateless. To create a cohesive "ChatGPT-like" experience where the AI remembers previous questions, we implemented memory management in `app/models/conversation_memory.py`.

- **Context Injection**: When `/api/chat/continue` is called, the backend retrieves the previous chat history for the given session.
- **System Prompts**: The backend dynamically prepends the chat history and any required "System Instructions" (e.g., *“You are a helpful AI assistant...”*) to the payload before sending it to the provider. This acts as the short-term and long-term memory for the AI.
