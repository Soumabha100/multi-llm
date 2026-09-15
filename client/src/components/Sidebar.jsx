import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, LogOut, Plus, X, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
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

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sessionId,
  sessions,
  isSessionsLoading,
  activeDropdownId,
  setActiveDropdownId,
  setSessionToRename,
  setNewTitle,
  setRenameModalOpen,
  setSessionToDelete,
  setDeleteModalOpen,
  setProfileModalOpen,
  handleLogout,
  isLoggingOut
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  
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
        <div className="h-2"></div>
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
                to={session.selectedModel ? `/chat/${session.id}/model/${session.selectedModel}` : `/chat/${session.id}`}
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
    <>
      <aside className="hidden md:flex md:flex-col w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      <div className="md:hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setSidebarOpen(false)}
              />
              
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
    </>
  );
};

export default Sidebar;
