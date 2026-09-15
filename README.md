# Multi-LLM ChatGPT Clone

A powerful, unified chat interface that allows users to interact with and compare multiple leading Large Language Models (LLMs) like OpenAI's GPT-4, Anthropic's Claude, and Google's Gemini all from a single application. It provides a ChatGPT-like experience with session management, authentication, and a responsive modern UI.

## Tech Stack

**Frontend:**
- React (with Vite)
- Tailwind CSS
- Firebase (Auth, Firestore, Hosting)

**Backend:**
- FastAPI (Python) *— handling the direct API interactions with LLM providers (to be integrated)*

## Prerequisites

- **Node.js** (v18+ recommended)
- A **Firebase Project** with the following services enabled:
  - Authentication (Email/Password)
  - Firestore Database
  - Firebase Hosting (Optional, for deployment)

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AI-ML
   ```

2. **Navigate to the frontend client:**
   ```bash
   cd client
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Environment Variables:**
   - Copy the provided example environment file to a new `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your actual Firebase project configuration values.

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173/`.

## Build and Deploy

To deploy the frontend to Firebase Hosting:

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Deploy Firestore Rules, Indexes, and Hosting:**
   ```bash
   # Deploy Firestore security rules and composite indexes
   firebase deploy --only firestore

   # Deploy the frontend build to Hosting
   firebase deploy --only hosting
   ```

## Team / Roles

- **Person 1 (Frontend):** React UI, Firebase Auth, Firestore integration, routing, styling, and security rules.
- **Person 2 (Backend):** FastAPI server, LLM provider integrations (OpenAI, Anthropic, Gemini), and API endpoints.
