import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Zap, ArrowRight, ArrowUpRight, MessageSquare, Columns, CheckCircle2, Database, Code2, Lock, Terminal, Shield, Globe, Cpu } from 'lucide-react';
import { GithubIcon } from './GitHubPage';

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const LandingPage = () => {
  const { currentUser, loading } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Redirect authenticated users to the chat dashboard
  if (currentUser && !loading) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="px-4 py-20 md:py-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-outfit font-bold tracking-tight mb-6 leading-tight">
                One prompt. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                  Multiple AI minds.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto lg:mx-0">
                Stop copy-pasting between tabs. Ask a single question, get answers from OpenAI, Claude, and Gemini side-by-side, then continue the conversation with the best one.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Try it free
                </Link>
                <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-center">
                  Log in
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="flex-1 w-full max-w-2xl relative"
            initial={{ opacity: 0, opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Abstract UI Mockup */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass-panel bg-gradient-to-br from-[var(--glass-bg)] to-transparent">
              {/* Fake OpenAI Card */}
              <motion.div 
                className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm h-48 md:h-56 lg:h-64 flex flex-col cursor-default"
                onMouseEnter={() => setHoveredCard('openai')}
                onMouseLeave={() => setHoveredCard(null)}
                animate={{
                  scale: hoveredCard === 'openai' ? 1.05 : (hoveredCard ? 0.95 : 1),
                  opacity: hoveredCard === 'openai' ? 1 : (hoveredCard ? 0.6 : 1),
                  borderColor: hoveredCard === 'openai' ? '#10a37f' : 'var(--border-color)',
                  boxShadow: hoveredCard === 'openai' ? '0 0 20px rgba(16, 163, 127, 0.2)' : 'none',
                  zIndex: hoveredCard === 'openai' ? 20 : 10
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-2 mb-4 text-[#10a37f]">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold text-sm">OpenAI</span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                </div>
              </motion.div>
              
              {/* Fake Claude Card */}
              <motion.div 
                className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm h-48 md:h-56 lg:h-64 flex flex-col cursor-default"
                onMouseEnter={() => setHoveredCard('claude')}
                onMouseLeave={() => setHoveredCard(null)}
                animate={{
                  scale: hoveredCard === 'claude' ? 1.05 : (hoveredCard ? 0.95 : 1.02),
                  opacity: hoveredCard === 'claude' ? 1 : (hoveredCard ? 0.6 : 1),
                  borderColor: hoveredCard === 'claude' ? '#d97757' : (hoveredCard ? 'var(--border-color)' : 'rgba(217, 119, 87, 0.5)'),
                  boxShadow: hoveredCard === 'claude' ? '0 0 20px rgba(217, 119, 87, 0.2)' : 'none',
                  zIndex: hoveredCard === 'claude' ? 20 : (hoveredCard ? 10 : 15)
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-2 mb-4 text-[#d97757]">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold text-sm">Claude</span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="h-8 bg-blue-500 text-white rounded w-full flex items-center justify-center text-xs font-medium">Continue</div>
                </div>
              </motion.div>

              {/* Fake Gemini Card */}
              <motion.div 
                className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm h-48 md:h-56 lg:h-64 flex-col hidden md:flex cursor-default"
                onMouseEnter={() => setHoveredCard('gemini')}
                onMouseLeave={() => setHoveredCard(null)}
                animate={{
                  scale: hoveredCard === 'gemini' ? 1.05 : (hoveredCard ? 0.95 : 1),
                  opacity: hoveredCard === 'gemini' ? 1 : (hoveredCard ? 0.6 : 1),
                  borderColor: hoveredCard === 'gemini' ? '#8b5cf6' : 'var(--border-color)',
                  boxShadow: hoveredCard === 'gemini' ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none',
                  zIndex: hoveredCard === 'gemini' ? 20 : 10
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-2 mb-4 text-[#8b5cf6]">
                  <Zap className="w-5 h-5" />
                  <span className="font-bold text-sm">Gemini</span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>
          </motion.div>
        </section>

        {/* SECTION: HOW IT WORKS */}
        <section id="features" className="px-4 py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex flex-col items-center text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-primary)] text-blue-600 font-medium text-sm mb-4 border border-[var(--border-color)]">
                  <Zap className="w-4 h-4" />
                  <span>Streamlined Protocol</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold tracking-tight mb-4">
                  How it works
                </h2>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                  Compare foundation models efficiently in three intuitive steps without managing separate subscription dashboards.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {[
                {
                  icon: MessageSquare,
                  num: "01",
                  title: "1. Ask Once",
                  desc: "Type your technical prompt into a single consolidated composer. Eliminate fragmented context switching across separate browser tabs and logins.",
                  badge: "Single input prompt broadcast",
                  badgeColor: "bg-blue-500",
                  iconBg: "bg-blue-500/10",
                  iconColor: "text-blue-500",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
                  borderColor: "hover:border-blue-500/30"
                },
                {
                  icon: Columns,
                  num: "02",
                  title: "2. Compare Answers",
                  desc: "Watch OpenAI, Claude, and Gemini stream their logic simultaneously in synchronous columns, highlighting differences in reasoning, depth, and speed.",
                  badge: "Synchronous side-by-side stream",
                  badgeColor: "bg-purple-500",
                  iconBg: "bg-purple-500/10",
                  iconColor: "text-purple-500",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
                  borderColor: "hover:border-purple-500/30"
                },
                {
                  icon: CheckCircle2,
                  num: "03",
                  title: "3. Continue With Best",
                  desc: "Select the response that produced the cleanest architecture or most accurate code, and branch into an uninterrupted single-model deep session.",
                  badge: "Branch thread seamlessly",
                  badgeColor: "bg-emerald-500",
                  iconBg: "bg-emerald-500/10",
                  iconColor: "text-emerald-500",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                  borderColor: "hover:border-emerald-500/30"
                }
              ].map((step, idx) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <div className={`relative rounded-2xl glass-panel p-6 md:p-8 flex flex-col justify-between h-full transition-all duration-500 group ${step.hoverGlow} ${step.borderColor} hover:-translate-y-2 cursor-default`}>
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center ${step.iconColor} group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-500 shadow-sm`}>
                          <step.icon className="w-7 h-7" />
                        </div>
                        <span className="font-mono text-xl font-bold text-[var(--text-secondary)] opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 group-hover:text-[var(--text-primary)]">{step.num}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 transition-colors duration-300">{step.title}</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-lg">
                        {step.desc}
                      </p>
                    </div>
                    <div className="mt-auto pt-5 border-t border-[var(--border-color)]/50 group-hover:border-[var(--border-color)] transition-colors duration-300">
                      <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
                        <span className={`w-2.5 h-2.5 rounded-full ${step.badgeColor} group-hover:animate-pulse shadow-[0_0_10px_currentColor]`}></span>
                        {step.badge}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: WHY MULTI LLM? (Bento Grid) */}
        <section className="px-4 py-24 max-w-7xl mx-auto w-full">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 uppercase tracking-widest mb-3">Engineered For Precision</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold tracking-tight">
                  Why engineers build with <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Multi LLM</span>
                </h2>
              </div>
              <p className="text-[var(--text-secondary)] text-lg max-w-md pb-2 md:pb-4">
                Built for developers, technical researchers, and founders who need definitive model benchmarking without subscription lock-in.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Large 2-Column Hero Card */}
            <FadeIn delay={0.1}>
              <div className="md:col-span-2 rounded-2xl glass-panel p-6 md:p-8 lg:p-10 flex flex-col justify-between h-full group relative overflow-hidden hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium text-xs mb-6 group-hover:border-blue-500/30 transition-colors">
                    <Zap className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span>Sub-millisecond Orchestration</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--text-primary)] group-hover:to-gray-500 transition-colors duration-300">Zero-Latency Asynchronous Ingestion</h3>
                  <p className="text-[var(--text-secondary)] text-lg max-w-xl mb-8">
                    Our asynchronous FastAPI backend triggers parallel non-blocking coroutines across provider APIs. If one model throttles, the others stream unhindered.
                  </p>
                </div>
                
                {/* Technical Visual Mockup */}
                <div className="mt-auto rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-5 relative z-10">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] mb-4">
                    <span>Async Task Dispatcher</span>
                    <span className="font-bold text-blue-600">Concurrent 3x Worker Threads</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-xs">OpenAI</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} whileInView={{ width: '82%' }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="font-mono text-xs w-12 text-right">1.1s</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-xs">Claude</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} whileInView={{ width: '95%' }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                      <span className="font-mono text-xs w-12 text-right">0.9s</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-xs">Gemini</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} whileInView={{ width: '68%' }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 }}
                          className="h-full bg-purple-500 rounded-full"
                        />
                      </div>
                      <span className="font-mono text-xs w-12 text-right">1.4s</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Bento 2: Independent Context Card */}
            <FadeIn delay={0.2} className="h-full">
              <div className="rounded-2xl glass-panel p-8 flex flex-col justify-between h-full hover:shadow-2xl hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1 group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Isolated Contexts</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                    Every session maintains a dedicated conversation history and token budget in Firestore.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-[var(--border-color)]/50 group-hover:border-[var(--border-color)] transition-colors flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">State Management</span>
                  <span className="font-bold text-purple-600 group-hover:animate-pulse shadow-[0_0_10px_rgba(168,85,247,0)] group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-shadow">Zero bleed</span>
                </div>
              </div>
            </FadeIn>

            {/* Bento 3: Rich Code & Syntax Card */}
            <FadeIn delay={0.3} className="h-full">
              <div className="rounded-2xl glass-panel p-8 flex flex-col justify-between h-full hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1 group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Technical Syntax</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                    Native syntax highlighting, math rendering, and side-by-side diffs across 3 AI models.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-[var(--border-color)]/50 group-hover:border-[var(--border-color)] transition-colors flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">TS • Go • Rust</span>
                  <span className="font-bold text-blue-600 group-hover:animate-pulse shadow-[0_0_10px_rgba(59,130,246,0)] group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-shadow">Native Highlight</span>
                </div>
              </div>
            </FadeIn>

            {/* Bento 4: Open Source Card (2-Col Wide) */}
            <FadeIn delay={0.4} className="md:col-span-2">
              <div className="rounded-2xl glass-panel p-6 md:p-8 lg:p-10 flex flex-col justify-between h-full hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 group">
                <div className="flex flex-col mb-8">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Open Source & BYO Keys</h3>
                    <p className="text-[var(--text-secondary)] text-lg max-w-xl">
                      Plug in your individual OpenAI, Anthropic, or Google Cloud API tokens. Your secrets are encrypted in local device storage.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-[var(--border-color)]/50 group-hover:border-[var(--border-color)] transition-colors">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-secondary)]">
                    <span className="px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] group-hover:border-emerald-500/30 transition-colors">AES-256 Key Vault</span>
                    <span className="px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] group-hover:border-emerald-500/30 transition-colors">Docker Deployable</span>
                    <span className="px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] group-hover:border-emerald-500/30 transition-colors">Apache 2.0 License</span>
                  </div>
                  <div className="shrink-0">
                    <Link to="/github" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/10 text-[var(--text-primary)] font-medium transition-all duration-300 shadow-sm group-hover:shadow-emerald-500/20">
                      <GithubIcon className="w-5 h-5 text-emerald-500" />
                      <span>Clone Repo</span>
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SECTION: CONTRIBUTORS */}
        <section className="px-4 py-16 max-w-7xl mx-auto w-full">
          <FadeIn>
            <div className="rounded-2xl glass-panel p-6 md:p-8 lg:p-10 bg-gradient-to-br from-[var(--glass-bg)] to-transparent">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Open Source Engineering</div>
                  <h3 className="text-2xl md:text-3xl font-outfit font-bold">Built by AI systems researchers</h3>
                </div>
                <a href="https://github.com/Soumabha100/multi-llm" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-1 group">
                  <span>View GitHub Repository</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { name: "Tamalika Das", role: "Frontend Architect", username: "tamalika2006" },
                  { name: "Soumabha Majumder", role: "Backend Engineer", username: "Soumabha100" },
                  { name: "Shubham Ghosh", role: "Systems Integration", username: "Shubhamsimple" }
                ].map((author, idx) => (
                  <a key={idx} href={`https://github.com/${author.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-blue-500/50 hover:shadow-md transition-all duration-300 group">
                    <img src={`https://github.com/${author.username}.png`} alt={author.name} className="w-12 h-12 rounded-full border border-[var(--border-color)] group-hover:scale-110 transition-transform duration-300 shadow-sm" />
                    <div>
                      <div className="font-bold group-hover:text-blue-500 transition-colors duration-300">{author.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{author.role}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h2 className="text-xl font-outfit font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              Multi LLM
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">Compare AI minds. Work faster.</p>
          </div>
          
          <div className="flex gap-6 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-[var(--border-color)] text-center text-[var(--text-secondary)] text-sm">
          &copy; {new Date().getFullYear()} Multi LLM Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
