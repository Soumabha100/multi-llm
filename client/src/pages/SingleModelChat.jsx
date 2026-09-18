import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import Modal from '../components/Modal';
import { Bot, Sparkles, Zap, Menu, Loader2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserSessions, getSessionMessages, addMessageToSession, updateSession, deleteSession } from '../services/chatService';
import { sendContinuePrompt } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

const modelsConfig = {
  tokenharbor: { name: 'Claude 3', icon: Bot, color: '#1d4ed8', bgClass: 'bg-[#1d4ed8]', borderClass: 'border-[#1d4ed8]/30', textClass: 'text-[#1d4ed8]' },
  openrouter: { name: 'GPT-3.5', icon: Sparkles, color: '#10a37f', bgClass: 'bg-[#10a37f]', borderClass: 'border-[#10a37f]/30', textClass: 'text-[#10a37f]' },
  gemini: { name: 'Gemini 3.8', icon: Zap, color: '#8b5cf6', bgClass: 'bg-[#8b5cf6]', borderClass: 'border-[#8b5cf6]/30', textClass: 'text-[#8b5cf6]' }
};

const SingleModelChat = () => {
  const { sessionId, modelId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);

  // App & History State
  const [history, setHistory] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActiveSessionLoading, setIsActiveSessionLoading] = useState(true);

  // Sidebar & Sessions State
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Model Switcher State
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const activeModelConfig = modelsConfig[modelId] || modelsConfig['tokenharbor'];

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isProcessing]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getUserSessions(currentUser.uid);
      setSessions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSessionsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load Active Session
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!sessionId) return;
      setIsActiveSessionLoading(true);
      try {
        const messages = await getSessionMessages(sessionId);
        const loadedHistory = [];

        messages.forEach((msg) => {
          if (msg.role === 'user') {
            loadedHistory.push({ role: 'user', content: msg.content });
          } else if (msg.role === 'model' && msg.model) {
            loadedHistory.push({ role: 'model', content: msg.content, model: msg.model });
          }
        });

        setHistory(loadedHistory);
      } catch (error) {
        console.error(error);
        showToast({ type: 'error', message: 'Failed to load session details' });
      } finally {
        setIsActiveSessionLoading(false);
      }
    };

    loadActiveSession();
  }, [sessionId, showToast]);

  const handleSendPrompt = async (newPrompt) => {
    setPrompt("");
    setIsProcessing(true);
    
    // Optimistic UI
    const userMessage = { role: 'user', content: newPrompt };
    setHistory(prev => [...prev, userMessage]);

    try {
      await addMessageToSession(sessionId, userMessage);
      
      const response = await sendContinuePrompt(newPrompt, modelId, history, sessionId);
      
      const actualModelName = response.model_name || modelId;
      const modelMessage = { role: 'model', content: response.response, model: actualModelName };
      await addMessageToSession(sessionId, modelMessage);
      
      setHistory(prev => [...prev, modelMessage]);
      loadSessions();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Failed to fetch AI response.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelSwitch = async (newModelId) => {
    if (newModelId === modelId) return;
    setIsModelDropdownOpen(false);
    try {
      await updateSession(sessionId, { selectedModel: newModelId });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, selectedModel: newModelId } : s));
      navigate(`/chat/${sessionId}/model/${newModelId}`, { replace: true });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Failed to switch model' });
    }
  };

  // Sidebar handlers
  const handleRename = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !sessionToRename) return;
    setIsRenaming(true);
    try {
      await updateSession(sessionToRename, { title: newTitle });
      setSessions(prev => prev.map(s => s.id === sessionToRename ? { ...s, title: newTitle } : s));
      setRenameModalOpen(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      setDeleteModalOpen(false);
      if (sessionId === sessionToDelete) navigate('/chat');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const ActiveIcon = activeModelConfig.icon;

  return (
    <div className="h-[100dvh] flex bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sessionId={sessionId}
        sessions={sessions}
        isSessionsLoading={isSessionsLoading}
        activeDropdownId={activeDropdownId}
        setActiveDropdownId={setActiveDropdownId}
        setSessionToRename={setSessionToRename}
        setNewTitle={setNewTitle}
        setRenameModalOpen={setRenameModalOpen}
        setSessionToDelete={setSessionToDelete}
        setDeleteModalOpen={setDeleteModalOpen}
        setProfileModalOpen={setProfileModalOpen}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        
        {/* PREMIUM HEADER WITH MODEL SWITCHER */}
        <header className="sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 py-3 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 flex justify-center md:justify-start">
              <div className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border bg-[var(--bg-primary)] shadow-sm hover:shadow-md active:scale-95 ${activeModelConfig.borderClass}`}
                >
                  <div className={`p-1 rounded-md ${activeModelConfig.bgClass} text-white`}>
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <span className={`font-medium ${activeModelConfig.textClass}`}>
                    {(() => {
                      const lastModelMsg = [...history].reverse().find(m => m.role === 'model');
                      return (lastModelMsg && lastModelMsg.model !== modelId && lastModelMsg.model !== "unknown") 
                        ? lastModelMsg.model 
                        : activeModelConfig.name;
                    })()}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>

                {/* Model Switcher Dropdown */}
                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-xl rounded-2xl z-50 overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {Object.entries(modelsConfig).map(([id, config]) => {
                            const Icon = config.icon;
                            const isSelected = id === modelId;
                            return (
                              <button
                                key={id}
                                onClick={() => handleModelSwitch(id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${isSelected ? 'bg-[var(--bg-primary)]' : 'hover:bg-[var(--bg-primary)]'}`}
                              >
                                <div className={`p-1.5 rounded-lg ${config.bgClass} text-white transition-transform group-hover:scale-110`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`flex-1 text-sm font-medium ${isSelected ? config.textClass : 'text-[var(--text-primary)] group-hover:' + config.textClass}`}>
                                  {config.name}
                                </span>
                                {isSelected && <Check className={`w-4 h-4 ${config.textClass}`} />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto space-y-8 pb-4">
            {isActiveSessionLoading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {history.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  // Display model specifics if the message was from a model
                  const msgModelConfig = msg.role === 'model' && msg.model ? modelsConfig[msg.model] : null;
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && msgModelConfig && (
                        <div className="flex-shrink-0 mr-4 mt-1 hidden sm:block">
                          <div className={`p-2 rounded-xl text-white shadow-md ${msgModelConfig.bgClass}`}>
                            <msgModelConfig.icon className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`max-w-[90%] md:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl p-4 md:p-5 rounded-3xl relative shadow-sm ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-500/20' 
                          : `bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-tl-sm backdrop-blur-md`
                      }`}>
                        {!isUser && msgModelConfig && (
                          <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 sm:hidden">
                            <span className={msgModelConfig.textClass}>{msgModelConfig.name}</span>
                          </div>
                        )}
                        <MarkdownRenderer content={msg.content} isUser={isUser} />
                      </div>
                    </motion.div>
                  );
                })}
                
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex-shrink-0 mr-4 mt-1 hidden sm:block">
                      <div className={`p-2 rounded-xl text-white shadow-md ${activeModelConfig.bgClass} animate-pulse`}>
                        <ActiveIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="max-w-[90%] md:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl p-4 md:p-5 rounded-3xl rounded-tl-sm bg-[var(--glass-bg)] border border-[var(--border-color)] backdrop-blur-md shadow-sm">
                      <div className="flex space-x-2 items-center h-6">
                        <div className={`w-2 h-2 rounded-full ${activeModelConfig.bgClass} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                        <div className={`w-2 h-2 rounded-full ${activeModelConfig.bgClass} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                        <div className={`w-2 h-2 rounded-full ${activeModelConfig.bgClass} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex-shrink-0 z-20">
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
            <ChatInput 
              onSend={handleSendPrompt} 
              disabled={isProcessing || isActiveSessionLoading} 
              selectedModel={modelId} 
            />
            <div className="text-center mt-3 text-xs text-[var(--text-secondary)]">
              {activeModelConfig.name} can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </main>

      {/* Reused Modals */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Chat" type="warning">
        <p className="text-[var(--text-secondary)] mb-6">Are you sure you want to delete this chat session?</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-lg font-medium border border-[var(--border-color)]">Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white flex items-center gap-2">
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
          </button>
        </div>
      </Modal>

      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Rename Chat" type="info">
        <form onSubmit={handleRename}>
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500 mb-6 text-[var(--text-primary)]" autoFocus />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setRenameModalOpen(false)} disabled={isRenaming} className="px-4 py-2 rounded-lg font-medium border border-[var(--border-color)]">Cancel</button>
            <button type="submit" disabled={!newTitle.trim() || isRenaming} className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white flex items-center gap-2">
              {isRenaming && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </Modal>
      
    </div>
  );
};

export default SingleModelChat;
