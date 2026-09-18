import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Star, GitFork, BookOpen, Users, Terminal } from 'lucide-react';

export const GithubIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const GitHubPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />
      
      <main className="flex-1 py-16 md:py-24 px-4 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <GithubIcon className="w-10 h-10 text-[var(--text-primary)]" />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-outfit font-bold tracking-tight mb-4"
          >
            Open Source <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-400 dark:from-gray-300 dark:to-white">Collaboration</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8"
          >
            Multi LLM is built by developers, for developers. We believe in open-source principles and community-driven AI architecture.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <a 
              href="https://github.com/Soumabha100/multi-llm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 font-bold transition-all duration-300 shadow-lg"
            >
              <GithubIcon className="w-5 h-5" />
              <span>View on GitHub</span>
            </a>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <FadeIn delay={0.1}>
            <a href="https://github.com/Soumabha100/multi-llm" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 flex items-center gap-6 hover:border-gray-400 dark:hover:border-white/40 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Star the Repository</h3>
                <p className="text-[var(--text-secondary)] text-sm">Show your support and stay updated with the latest releases.</p>
              </div>
            </a>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <a href="https://github.com/Soumabha100/multi-llm/fork" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 flex items-center gap-6 hover:border-gray-400 dark:hover:border-white/40 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitFork className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Fork & Contribute</h3>
                <p className="text-[var(--text-secondary)] text-sm">Join the community! Submit PRs to improve the orchestrator.</p>
              </div>
            </a>
          </FadeIn>
        </div>

        <div className="glass-panel p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-blue-500" />
            Quick Start Guide
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Clone the repository</h3>
              <div className="bg-[#0a0a0a] text-gray-300 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-pink-500">git clone</span> https://github.com/Soumabha100/multi-llm.git<br/>
                <span className="text-pink-500">cd</span> multi-llm-chat
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Backend Setup (FastAPI)</h3>
              <div className="bg-[#0a0a0a] text-gray-300 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-pink-500">cd</span> backend<br/>
                <span className="text-pink-500">python</span> -m venv venv<br/>
                <span className="text-gray-500"># Windows: venv\Scripts\activate</span><br/>
                <span className="text-pink-500">source</span> venv/bin/activate<br/>
                <span className="text-pink-500">pip</span> install -r requirements.txt<br/>
                <span className="text-pink-500">python</span> run.py
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Frontend Setup (React)</h3>
              <div className="bg-[#0a0a0a] text-gray-300 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-pink-500">cd</span> client<br/>
                <span className="text-pink-500">npm</span> install<br/>
                <span className="text-pink-500">npm</span> run dev
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-[var(--text-secondary)] text-sm">
          &copy; {new Date().getFullYear()} Multi LLM Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default GitHubPage;
