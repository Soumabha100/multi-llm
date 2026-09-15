const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Send an initial prompt to all models in parallel via the FastAPI backend.
 * @param {string} prompt - The user query
 * @param {string} sessionId - The session ID to link to
 * @param {Array} history - The full history of the conversation to send to the backend
 * @returns {Promise<Object>} The parallel responses from openai, claude, gemini
 */
export const sendInitialPrompt = async (prompt, sessionId, history = []) => {
  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: prompt,
      session_id: sessionId,
      history: history
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  const data = await response.json();
  
  // Map the backend response format to the format expected by the frontend
  // Backend returns: { responses: { openai: { response: "..." }, claude: { response: "..." } } }
  return data.responses;
};

/**
 * Continue a conversation with a specific model via the FastAPI backend.
 * @param {string} prompt - The user query
 * @param {string} model - The selected model (openai, claude, gemini)
 * @param {Array} history - The full history of the conversation with this model
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The single response from the selected model
 */
export const sendContinuePrompt = async (prompt, model, history = [], sessionId) => {
  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  const response = await fetch(`${API_BASE_URL}/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      selected_model: model,
      message: prompt,
      history: history
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  return await response.json();
};
