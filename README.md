# Multi-LLM Custom ChatGPT Clone (Beta Version)

Welcome to the **Multi-LLM Custom ChatGPT Clone**, a powerful, side-by-side AI chat application built to execute parallel reasoning across multiple Large Language Models (LLMs) simultaneously. 

This project fulfills the specifications of **Project 1**, allowing users to query multiple top-tier models (like OpenAI, Claude, and Gemini) at the exact same time, compare their answers side-by-side, and choose the best response to continue a deep, single-model conversation.

## 🚀 Key Features

- **Ask a Single Question**: Users enter a single prompt into a unified chat interface.
- **Query Multiple LLMs in Parallel**: The backend orchestrator sends the exact same prompt to multiple AI models simultaneously (e.g., GPT-3.5, Claude 3, Gemini 3.6).
- **Compare & Continue**: The frontend presents all generated answers in a side-by-side panel layout. The user can evaluate the responses and click "Continue with this model" to seamlessly transition into a focused, single-LLM chat session.
- **Persistent Memory & Sessions**: Every model maintains its own chat history (Short-term and Long-term memory), allowing for robust, continuous conversations.
- **Modern UI/UX**: Built with a beautiful, fully responsive glass-morphism design, featuring smooth Framer Motion animations and robust Markdown rendering.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Firebase Auth & Firestore.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, asyncio (for parallel execution).
- **Tools**: VS Code / PyCharm.

## 📚 Documentation Structure

For deep technical dives into how this application works, please refer to our detailed documentation files located in their respective directories:

- [**Frontend Documentation**](./client/Docs.md): Covers React routing, Firebase Authentication, Firestore database logic, UI components, and Markdown formatting.
- [**Backend Documentation**](./backend/Docs.md): Covers FastAPI architecture, parallel execution logic (`orchestrator.py`), API Key management, conversation memory, and API routes.

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm
- Firebase Account (for Auth and Firestore)

### Installation

1. **Clone the repository** and navigate to the project root.
2. **Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```
   *Note: Reference `backend/.env.example` to set up your required API keys (OpenAI, Gemini, Anthropic).*

3. **Setup Frontend**:
   ```bash
   cd client
   npm install
   ```
   *Note: Reference `client/.env.example` to set up your Firebase configuration keys.*

4. **Run the Application**:
   - Start the backend server: `python run.py` (from the `backend` folder)
   - Start the frontend dev server: `npm run dev` (from the `client` folder)

## 👥 Authors & Contributors

This Beta Version was proudly developed and contributed to by:
- **Tamalika Das**
- **Soumabha Majumder**
- **Shubham Ghosh**
