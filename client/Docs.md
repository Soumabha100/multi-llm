# Frontend Architecture Documentation (Client)

This document provides a comprehensive technical overview of the React frontend architecture for the **Multi-LLM Custom ChatGPT Clone (Beta Version)**.

## 🏗 High-Level Architecture

The frontend is a Single Page Application (SPA) built using **React 19**, powered by the **Vite** build tool. It communicates with the Python FastAPI backend to execute AI generations and heavily integrates with **Firebase** for user authentication and database management. 

### Technology Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Markdown Parsing**: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
- **Backend Communication**: Fetch API (`src/services/api.js`)
- **Database & Auth**: Firebase (`src/services/chatService.js` & `AuthContext.jsx`)

---

## 🔐 Authentication Flow

User authentication is managed entirely by Firebase. 
- **Provider**: `src/contexts/AuthContext.jsx` exposes a global state containing `currentUser`, `login`, `register`, and `logout` functions.
- **Routing Protection**: The `ProtectedRoute.jsx` component wraps any route that requires a logged-in user. If a user tries to access `/chat` without a valid Firebase session, they are redirected to `/login`.

---

## 🧭 Routing Structure

React Router (`react-router-dom`) is utilized for client-side navigation. The main routes are defined in `App.jsx`:

1. **`/` (LandingPage)**: A public marketing page showcasing the platform's capabilities.
2. **`/login` & `/register`**: Public routes for Firebase authentication.
3. **`/chat` (ChatDashboard)**: *Protected.* The primary workspace where a user inputs their *initial prompt*. This page handles the **parallel execution** of querying multiple LLMs at once.
4. **`/chat/:sessionId`**: *Protected.* Views an existing chat session. If a model hasn't been chosen yet, it shows the side-by-side comparison.
5. **`/chat/:sessionId/model/:modelId` (SingleModelChat)**: *Protected.* The dedicated chat interface used *after* a user selects a specific model to continue their conversation with. 

---

## 💬 Core Chat Logic & Components

### 1. `ChatDashboard.jsx` (Parallel Generation)
When a user submits their very first question in the `ChatDashboard`, the following sequence occurs:
1. A new chat session document is created in Firestore.
2. The user's prompt is saved to Firestore as the first message.
3. The frontend makes a request to the backend orchestrator (`/api/chat`) to hit all AI models simultaneously.
4. As the backend returns the responses, they are fed into the `MultiLLMPanel.jsx` component.

### 2. `MultiLLMPanel.jsx` (Side-by-Side Comparison)
This component renders the side-by-side cards comparing the responses from OpenAI, Claude, and Gemini. 
- **Action**: Users evaluate the markdown-rendered text in each card. 
- **Selection**: By clicking the "Continue with..." button, the frontend updates the Firestore session to lock in the `selectedModel`, and the router navigates the user to `SingleModelChat.jsx`.

### 3. `SingleModelChat.jsx` (Continued Conversation)
Once a model is selected, this page takes over.
- It loads the chat history specific to the selected session.
- Any subsequent messages sent by the user are saved to Firestore, and the frontend queries the `/api/chat/continue` backend route.
- The UI mimics a traditional ChatGPT layout, displaying user prompts on the right and AI responses on the left.

---

## 🎨 UI & Aesthetics

### Glass-morphism Theme
The application utilizes a custom `glass-panel` CSS utility (defined in `index.css`) to create premium, frosted-glass effects across the Navbar, Sidebar, and Chat bubbles.

### Dynamic Markdown Rendering
AI responses are formatted dynamically via the `MarkdownRenderer.jsx` component. This component intercepts raw markdown and renders:
- Beautiful HTML structures for lists and tables.
- Syntax-highlighted code blocks with built-in "Copy" functionality using `react-syntax-highlighter`.

### Responsive Sidebar
The `Sidebar.jsx` features complex logic to manage chat history:
- **Pagination**: It lazy-loads older chats to ensure UI performance.
- **Collapsible Animation**: Using Framer Motion, it seamlessly expands and collapses (`w-64` to `w-20`) to save screen real estate, automatically triggering on smaller laptops (under 1280px width).

---

## 🗄 Database (Firestore) Structure

Chats are structured in Firestore via functions in `chatService.js`.
- **Collection `users/{userId}/sessions`**: Stores metadata for each conversation (e.g., `title`, `updatedAt`, `selectedModel`).
- **Sub-collection `messages`**: Stores individual messages for a specific session (`role`, `content`, `timestamp`, `model`). This sub-collection ensures efficient querying when loading chat histories.
