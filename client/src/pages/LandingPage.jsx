import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { MessageSquare, Columns, CheckCircle2, Zap, Shield, MonitorSmartphone, Bot, Sparkles } from 'lucide-react';

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
              <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm h-48 md:h-56 lg:h-64 flex flex-col">
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
              </div>
              
              {/* Fake Claude Card */}
              <div className="bg-[var(--bg-primary)] rounded-xl border border-blue-500/50 p-4 shadow-md h-48 md:h-56 lg:h-64 flex flex-col scale-105 z-10 ring-2 ring-blue-500/20">
                <div className="flex items-center gap-2 mb-4 text-[#d97757]">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold text-sm">Claude</span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 bg-blue-500/20 rounded w-full"></div>
                  <div className="h-2 bg-blue-500/20 rounded w-11/12"></div>
                  <div className="h-2 bg-blue-500/20 rounded w-4/5"></div>
                  <div className="h-2 bg-blue-500/20 rounded w-full"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="h-8 bg-blue-500 text-white rounded w-full flex items-center justify-center text-xs font-medium">Continue</div>
                </div>
              </div>

              {/* Fake Gemini Card */}
              <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm h-48 md:h-56 lg:h-64 flex flex-col hidden md:flex">
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
              </div>
            </div>
            
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="features" className="px-4 py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">How it works</h2>
                <p className="text-[var(--text-secondary)] text-lg">Compare AI models efficiently in three simple steps.</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent"></div>

              {[
                {
                  icon: MessageSquare,
                  title: "1. Ask Once",
                  desc: "Type your prompt into a single interface. No need to manage multiple browser tabs."
                },
                {
                  icon: Columns,
                  title: "2. Compare Answers",
                  desc: "Instantly see how OpenAI, Claude, and Gemini approach your problem side-by-side."
                },
                {
                  icon: CheckCircle2,
                  title: "3. Continue With the Best",
                  desc: "Pick the response you like most and seamlessly continue the conversation with that specific model."
                }
              ].map((step, idx) => (
                <FadeIn key={idx} delay={idx * 0.2}>
                  <div className="relative flex flex-col items-center text-center p-6">
                    <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 shadow-sm z-10">
                      <step.icon className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="px-4 py-24 max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Why use Multi LLM?</h2>
              <p className="text-[var(--text-secondary)] text-lg">Built for developers and power users who need the best answers, fast.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Parallel Querying",
                desc: "We route your single prompt to multiple AI APIs concurrently, saving you minutes on every complex question."
              },
              {
                icon: Shield,
                title: "Secure Authentication",
                desc: "Your data and sessions are protected by industry-standard Firebase authentication and Firestore security rules."
              },
              {
                icon: MonitorSmartphone,
                title: "Modern Responsive UI",
                desc: "A beautiful, glassmorphic interface that looks and works perfectly on your desktop, tablet, or smartphone."
              },
              {
                icon: Bot,
                title: "Per-Model Chat History",
                desc: "Once you branch off with a specific model, it maintains full contextual awareness of your ongoing conversation."
              }
            ].map((feature, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500/30 transition-colors h-full group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
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
