// Mock responses for the initial parallel query
const mockInitialResponses = {
  openai: "Here is a detailed explanation based on the knowledge from OpenAI. The process is quite simple when broken down into steps. Let me know if you need any clarification.",
  claude: "I can help with that. From my analysis, the core concept revolves around optimizing the workflow. Would you like me to elaborate on any specific part?",
  gemini: "Here's a creative and analytical perspective on your question. Using Gemini's capabilities, we can see that this approach yields the best results."
};

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const sendInitialPrompt = async (prompt) => {
  // Simulate backend processing time
  await delay(1500);
  
  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  // Return the mock responses in parallel-like fashion
  return {
    openai: { response: mockInitialResponses.openai },
    claude: { response: mockInitialResponses.claude },
    gemini: { response: mockInitialResponses.gemini }
  };
};

export const sendContinuePrompt = async (prompt, model, history = []) => {
  // Simulate backend processing time
  await delay(1200);

  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  const responsesByModel = {
    openai: "As OpenAI, I'm continuing the conversation. Here is the follow-up information you requested.",
    claude: "Continuing as Claude: Based on our previous context, here is the next logical step.",
    gemini: "Gemini continuing here: Taking into account your previous inputs, let's explore this further."
  };

  return {
    response: responsesByModel[model] || "Generic continuation response."
  };
};
