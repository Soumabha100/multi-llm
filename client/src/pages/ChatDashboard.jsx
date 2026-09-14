import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { Sun, Moon, LogOut, MessageSquare, Plus, Menu, X, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import ChatInput from '../components/ChatInput';
import MultiLLMPanel from '../components/MultiLLMPanel';
import { sendInitialPrompt, sendContinuePrompt } from '../services/mockApi';
import { createSession, getUserSessions, getSessionMessages, addMessageToSession, updateSession, deleteSession } from '../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInMinutes = Math.floor((new Date() - date) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const ChatDashboard = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  
  // App states
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  
  // Active session states
  const [history, setHistory] = useState([]); 
  const [multiResponses, setMultiResponses] = useState(null); 
  const [selectedModel, setSelectedModel] = useState(null);
  const [isActiveSessionLoading, setIsActiveSessionLoading] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Dropdown states
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getUserSessions(currentUser.uid);
      setSessions(data);
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Failed to load chat history' });
    } finally {
      setIsSessionsLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load active session data when URL changes
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!sessionId) {
        setHistory([]);
        setMultiResponses(null);
        setSelectedModel(null);
        return;
      }

      setIsActiveSessionLoading(true);
      try {
        const messages = await getSessionMessages(sessionId);
        const currentSession = sessions.find(s => s.id === sessionId);
        
        if (currentSession) {
          setSelectedModel(currentSession.selectedModel || null);
        }

        // Reconstruct local state from Firestore messages
        const loadedHistory = [];
        let loadedMulti = null;

        messages.forEach((msg) => {
          if (msg.role === 'user') {
            loadedHistory.push({ role: 'user', content: msg.content });
          } else if (msg.role === 'model') {
            if (msg.model) {
              // It's a post-selection continuation response or the selected model's first response
              loadedHistory.push({ role: 'model', content: msg.content, model: msg.model });
            } else if (msg.modelResponses) {
              // It's the parallel responses block
              loadedMulti = msg.modelResponses;
            }
          }
        });

        setHistory(loadedHistory);
        setMultiResponses(loadedMulti);

      } catch (error) {
        console.error(error);
        showToast({ type: 'error', message: 'Failed to load session details' });
      } finally {
        setIsActiveSessionLoading(false);
      }
    };

    if (!isSessionsLoading) {
      loadActiveSession();
    }
  }, [sessionId, sessions, isSessionsLoading, showToast]);

  const handleSendPrompt = async (newPrompt) => {
    setPrompt("");
    setIsProcessing(true);
    
    // Optimistic UI
    const userMessage = { role: 'user', content: newPrompt };
    setHistory(prev => [...prev, userMessage]);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        activeSessionId = await createSession(currentUser.uid, newPrompt);
        navigate(`/chat/${activeSessionId}`, { replace: true });
        
        setSessions(prev => [{ id: activeSessionId, title: newPrompt.split(' ').slice(0, 5).join(' '), createdAt: new Date() }, ...prev]);
      }

      await addMessageToSession(activeSessionId, { role: 'user', content: newPrompt });

      if (!selectedModel) {
        setMultiResponses(null);
        const responses = await sendInitialPrompt(newPrompt);
        
        await addMessageToSession(activeSessionId, { 
          role: 'model', 
          content: '', 
          modelResponses: responses 
        });
        
        setMultiResponses(responses);
      } else {
        const response = await sendContinuePrompt(newPrompt, selectedModel, history);
        
        await addMessageToSession(activeSessionId, {
          role: 'model',
          content: response.response,
          model: selectedModel
        });
        
        setHistory(prev => [...prev, { role: 'model', content: response.response, model: selectedModel }]);
      }
      
      loadSessions();

    } catch (error) {
      console.error("Error fetching response:", error);
      showToast({ type: 'error', message: 'Failed to fetch AI responses. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectModel = async (modelId, responseContent) => {
    if (!sessionId) return;
    
    setSelectedModel(modelId);
    setHistory(prev => [
      ...prev, 
      { role: 'model', content: responseContent, model: modelId }
    ]);
    setMultiResponses(null); 

    try {
      await updateSession(sessionId, { selectedModel: modelId });
      
      await addMessageToSession(sessionId, {
        role: 'model',
        content: responseContent,
        model: modelId
      });
      
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, selectedModel: modelId } : s));
      
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Failed to save model selection' });
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !sessionToRename) return;
    
    setIsRenaming(true);
    try {
      await updateSession(sessionToRename, { title: newTitle });
      setSessions(prev => prev.map(s => s.id === sessionToRename ? { ...s, title: newTitle } : s));
      showToast({ type: 'success', message: 'Session renamed' });
      setRenameModalOpen(false);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to rename session' });
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
      showToast({ type: 'success', message: 'Session deleted' });
      setDeleteModalOpen(false);
      
      if (sessionId === sessionToDelete) {
        navigate('/chat');
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to delete session' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast({ type: 'success', message: 'Logged out successfully' });
      setProfileModalOpen(false);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to log out' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Reusable Sidebar Content
  const SidebarContent = () => (
    <>
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)]">
        <Link to="/chat" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
          <h1 className="text-xl font-outfit font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
            Multi LLM
          </h1>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-[var(--border-color)]">
        <Link 
          to="/chat"
          onClick={() => setSidebarOpen(false)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] transform active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </Link>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)' }}
      >
        <div className="h-2"></div> {/* Spacer for mask */}
        {isSessionsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-8 text-sm text-[var(--text-secondary)]">
            No chats yet.<br/>Start one above!
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id} 
              className={`relative group rounded-xl transition-all duration-200 ${sessionId === session.id ? 'bg-[var(--bg-primary)] border border-blue-500/40 shadow-sm shadow-blue-500/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:shadow-sm'}`}
            >
              <Link 
                to={`/chat/${session.id}`}
                onClick={() => setSidebarOpen(false)}
                className="block px-3 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              >
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{session.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{formatTimeAgo(session.updatedAt)}</div>
              </Link>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                  <button 
                    onClick={(e) => { e.preventDefault(); setActiveDropdownId(activeDropdownId === session.id ? null : session.id); }}
                    className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeDropdownId === session.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                      <div className="absolute right-0 mt-1 w-36 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg rounded-xl z-50 overflow-hidden">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveDropdownId(null);
                            setSessionToRename(session.id);
                            setNewTitle(session.title);
                            setRenameModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Rename
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveDropdownId(null);
                            setSessionToDelete(session.id);
                            setDeleteModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-color)] space-y-2">
        {currentUser && (
          <button 
            onClick={() => setProfileModalOpen(true)}
            className="w-full flex items-center gap-3 px-2 py-2 mb-2 hover:bg-[var(--bg-primary)] dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{currentUser.displayName || "User"}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">{currentUser.email}</p>
            </div>
          </button>
        )}
        
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      <div className="md:hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* MOBILE OVERLAY */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* MOBILE SIDEBAR */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN PANEL */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Condensed Header */}
        <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between md:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-outfit font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Multi LLM</span>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {isActiveSessionLoading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-[var(--text-secondary)]">Loading session...</p>
              </div>
            ) : history.length === 0 && !isProcessing ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <MessageSquare className="w-10 h-10 text-blue-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-outfit font-bold tracking-tight mb-3">
                    How can I help you today?
                  </h2>
                  <p className="text-[var(--text-secondary)] max-w-md mx-auto text-lg leading-relaxed">
                    Ask a question and see responses from <span className="font-medium text-[var(--text-primary)]">OpenAI</span>, <span className="font-medium text-[var(--text-primary)]">Claude</span>, and <span className="font-medium text-[var(--text-primary)]">Gemini</span> side-by-side.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Render Conversation History */}
                {history.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-sm rounded-tl-sm backdrop-blur-md'
                    }`}>
                      {msg.role === 'model' && msg.model && (
                        <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                          {msg.model}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* Render Multi-LLM Panel (for the first query) */}
                {!selectedModel && (multiResponses || isProcessing) && (
                  <MultiLLMPanel 
                    isProcessing={isProcessing} 
                    responses={multiResponses} 
                    onSelectModel={handleSelectModel} 
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-12 pointer-events-none z-20">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <ChatInput 
              onSend={handleSendPrompt} 
              disabled={isProcessing || isActiveSessionLoading} 
              selectedModel={selectedModel} 
            />
            <div className="text-center mt-3 text-xs text-[var(--text-secondary)]">
              AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="Delete Chat" 
        type="warning"
      >
        <p className="text-[var(--text-secondary)] mb-6">Are you sure you want to delete this chat session? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg font-medium border border-[var(--border-color)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] disabled:opacity-70 flex items-center gap-2"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={renameModalOpen} 
        onClose={() => setRenameModalOpen(false)} 
        title="Rename Chat" 
        type="info"
      >
        <form onSubmit={handleRename}>
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            placeholder="Chat title"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button 
              type="button"
              onClick={() => setRenameModalOpen(false)}
              disabled={isRenaming}
              className="px-4 py-2 rounded-lg font-medium border border-[var(--border-color)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!newTitle.trim() || isRenaming}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] flex items-center gap-2"
            >
              {isRenaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        title="Your Profile" 
        type="info"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full shadow-sm object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium shadow-sm">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{currentUser?.displayName || "User"}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-secondary)]">Account created</p>
            <p className="font-medium text-[var(--text-primary)]">
              {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
            </p>
          </div>
          
          <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-70 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Log out
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ChatDashboard;
