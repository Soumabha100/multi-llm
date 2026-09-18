import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, LogOut, Menu, X, User, Code, Terminal } from 'lucide-react';
import { GithubIcon } from '../pages/GitHubPage';

const Navbar = ({ isChat = false }) => {
  const { currentUser, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useClickOutside(() => setDropdownOpen(false));
  const mobileMenuRef = useClickOutside(() => setMobileMenuOpen(false));

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async (closeMenu = () => {}) => {
    try {
      await logout();
      showToast({ type: 'success', message: 'Logged out successfully' });
      closeMenu();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to log out' });
    }
  };

  // Reusable Auth Controls Component
  const AuthControls = ({ mobile = false }) => {
    if (loading) {
      return (
        <div className="flex items-center gap-4">
          <div className="w-20 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      );
    }

    if (currentUser) {
      const initials = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U';
      
      if (mobile) {
        return (
          <div className="flex flex-col gap-2 w-full mt-4 border-t border-[var(--border-color)] pt-4">
            <div className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)]">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {initials}
              </div>
              <span className="truncate">{currentUser.email}</span>
            </div>
            <Link to="/chat" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left" onClick={() => setMobileMenuOpen(false)}>
              Chats
            </Link>
            <button onClick={() => handleLogout(() => setMobileMenuOpen(false))} className="px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        );
      }

      return (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] transition-transform hover:scale-105"
          >
            {initials}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 glass-panel py-2 shadow-xl z-50 origin-top-right"
              >
                <div className="px-4 py-2 border-b border-[var(--border-color)] mb-2">
                  <p className="text-sm truncate text-[var(--text-secondary)]">{currentUser.email}</p>
                </div>
                {!isChat && (
                  <Link to="/chat" className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-primary)] transition-colors focus:bg-[var(--bg-primary)] outline-none" onClick={() => setDropdownOpen(false)}>
                    <MessageSquareIcon className="w-4 h-4" /> <span>Chats</span>
                  </Link>
                )}
                <button 
                  onClick={() => { toggleTheme(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-primary)] transition-colors focus:bg-[var(--bg-primary)] outline-none"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 
                  <span>Toggle Theme</span>
                </button>
                <button 
                  onClick={() => handleLogout(() => setDropdownOpen(false))}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-primary)] text-red-500 transition-colors focus:bg-[var(--bg-primary)] outline-none"
                >
                  <LogOut className="w-4 h-4" /> <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Logged Out State
    if (mobile) {
      return (
        <div className="flex flex-col gap-3 mt-4 w-full">
          <Link to="/login" className="w-full py-2.5 text-center font-medium border border-[var(--border-color)] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)}>
            Log in
          </Link>
          <Link to="/register" className="w-full py-2.5 text-center font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700" onClick={() => setMobileMenuOpen(false)}>
            Sign up
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Link to="/login" className="px-4 py-2 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
          Log in
        </Link>
        <Link to="/register" className="px-5 py-2 font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]">
          Sign up
        </Link>
      </div>
    );
  };

  return (
    <>
      <header className={`sticky top-0 z-40 w-full h-[72px] transition-colors duration-300 ${isChat ? 'glass-panel border-x-0 border-t-0 rounded-none shadow-sm' : 'bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]'}`}>
        <div className="max-w-7xl 2xl:max-w-[90rem] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
            <h1 className="text-2xl font-outfit font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              Multi LLM
            </h1>
          </Link>

          {/* Center: Desktop Nav Links (Hidden in Chat) */}
          {!isChat && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 ${isActive(link.path) ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/github" className={`text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 flex items-center gap-2 ${isActive('/github') ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                <GithubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </Link>
            </nav>
          )}

          {/* Right: Controls & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Always visible theme toggle (except maybe inside the avatar dropdown for logged in desktop, but requirements say "visible in all states") */}
            {!currentUser && (
              <button 
                onClick={toggleTheme}
                className="hidden md:flex p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            <div className="hidden md:block min-w-[140px] flex justify-end">
               <AuthControls />
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <motion.div 
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-3/4 max-w-sm h-full bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-outfit font-bold">Menu</h2>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!isChat && (
                <nav className="flex flex-col gap-4 mb-8">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.path} 
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium ${isActive(link.path) ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link to="/github" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-medium flex items-center gap-2 ${isActive('/github') ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}>
                    <GithubIcon className="w-5 h-5" />
                    <span>GitHub</span>
                  </Link>
                </nav>
              )}

              <button 
                onClick={toggleTheme}
                className="flex items-center gap-3 text-lg font-medium text-[var(--text-primary)] mb-auto"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} 
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              <AuthControls mobile={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper for the icon missing from lucide import above
import { MessageSquare as MessageSquareIcon } from 'lucide-react';

export default Navbar;
