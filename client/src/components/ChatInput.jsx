import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInput = ({ onSend, disabled, selectedModel }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative glass-panel backdrop-blur-xl bg-white/50 dark:bg-[#1e1e2e]/50 border border-[var(--border-color)] rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
      <div className="absolute top-4 left-4 text-blue-500">
        {selectedModel ? (
          <Sparkles className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" /> // Can differentiate icon if needed
        )}
      </div>
      
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={selectedModel ? `Message ${selectedModel}...` : "Ask OpenAI, Claude, and Gemini..."}
        className="w-full max-h-[200px] min-h-[56px] py-4 pl-12 pr-14 bg-transparent resize-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] scrollbar-hide"
        rows="1"
        disabled={disabled}
      />

      <div className="absolute bottom-3 right-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {(input.trim() || disabled) && (
            <motion.button
              key="send-btn"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              type="submit"
              disabled={disabled || !input.trim()}
              className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                disabled 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-blue-500/25'
              }`}
            >
              <AnimatePresence mode="wait">
                {disabled ? (
                  <motion.div 
                    key="spinner"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" 
                  />
                ) : (
                  <motion.div
                    key="send-icon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
};

export default ChatInput;
