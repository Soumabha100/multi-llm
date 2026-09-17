import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, LogOut, Plus, X, MoreVertical, Edit2, Trash2, Loader2, PanelLeftClose, PanelLeftOpen, MessageSquare } from 'lucide-react';
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
  
  // Collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  
  // Auto-collapse on smaller desktop screens on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsCollapsed(true);
    }
  }, []);

  const visibleSessions = sessions.slice(0, visibleCount);
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <div className={`p-4 flex items-center justify-between border-b border-[var(--border-color)] h-[72px] ${collapsed ? 'justify-center' : ''}`}>
          {(!collapsed || isMobile) && (
            <Link to="/chat" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 min-w-0">
              <h1 className="text-xl font-outfit font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 truncate">
                Multi LLM
              </h1>
            </Link>
          )}
          
          {isMobile ? (
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className={`p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 ${collapsed ? '' : 'ml-auto'}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* NEW CHAT BUTTON */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <Link 
            to="/chat"
            onClick={() => setSidebarOpen(false)}
            className={`w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] transform active:scale-[0.98] ${collapsed ? 'px-0' : 'px-4'}`}
            title="New Chat"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">New Chat</span>}
          </Link>
        </div>

        {/* CHAT LIST */}
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
            <div className={`text-center p-8 text-sm text-[var(--text-secondary)] ${collapsed ? 'px-2' : ''}`}>
              {!collapsed ? (
                <>No chats yet.<br/>Start one above!</>
              ) : (
                <MessageSquare className="w-5 h-5 mx-auto opacity-50" />
              )}
            </div>
          ) : (
            <>
              {visibleSessions.map(session => (
                <div 
                  key={session.id} 
                  className={`relative group rounded-xl transition-all duration-200 ${sessionId === session.id ? 'bg-[var(--bg-primary)] border border-blue-500/40 shadow-sm shadow-blue-500/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:shadow-sm'} ${activeDropdownId === session.id ? 'z-40' : 'z-10'}`}
                  title={collapsed ? session.title : undefined}
                >
                  <Link 
                    to={session.selectedModel ? `/chat/${session.id}/model/${session.selectedModel}` : `/chat/${session.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`block py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl ${collapsed ? 'px-0 flex justify-center items-center h-12' : 'px-3 w-full pr-10'}`}
                  >
                    {collapsed ? (
                      <MessageSquare className={`w-5 h-5 ${sessionId === session.id ? 'text-blue-500' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
                    ) : (
                      <>
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">{session.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">{formatTimeAgo(session.updatedAt)}</div>
                      </>
                    )}
                  </Link>
                  
                  {!collapsed && (
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
                            <div className="absolute right-0 mt-2 w-36 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl rounded-xl z-50 overflow-hidden flex flex-col py-1">
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
                  )}
                </div>
              ))}
              
              {!collapsed && visibleCount < sessions.length && (
                <div className="pt-2 pb-4 flex justify-center">
                  <button 
                    onClick={handleLoadMore}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className={`p-4 border-t border-[var(--border-color)] flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
          {currentUser && (
            <button 
              onClick={() => setProfileModalOpen(true)}
              className={`w-full flex items-center gap-3 py-2 mb-2 hover:bg-[var(--bg-primary)] dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${collapsed ? 'justify-center px-0' : 'px-2'}`}
              title={collapsed ? "Profile" : undefined}
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{currentUser.displayName || "User"}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{currentUser.email}</p>
                </div>
              )}
            </button>
          )}
          
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${collapsed ? 'justify-center px-0' : 'px-2'}`}
            title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 py-2 text-sm font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${collapsed ? 'justify-center px-0' : 'px-2'}`}
            title={collapsed ? "Log out" : undefined}
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <LogOut className="w-5 h-5 flex-shrink-0" />}
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }} // 256px = w-64, 80px = w-20
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="hidden md:flex md:flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-shrink-0 z-30"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

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
                className="fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col"
              >
                <SidebarContent isMobile={true} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Sidebar;
