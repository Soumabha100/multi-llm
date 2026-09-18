import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Zap, Shield, Bot, Code, Cpu, Database, Blocks, Workflow, Brain } from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const FeaturesPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />
      
      <main className="flex-1 py-16 md:py-24 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 md:mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold tracking-tight mb-6"
          >
            Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Capabilities</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto"
          >
            Discover the powerful infrastructure and advanced features that make Multi LLM the ultimate workspace for comparing AI models.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: Zap,
              color: "text-blue-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Asynchronous Parallel Execution",
              desc: "Our FastAPI backend utilizes Python's asyncio to multiplex your single prompt across OpenAI, Anthropic, and Google servers concurrently. No waiting for the slowest model to finish before seeing results from the fastest.",
              span: "md:col-span-2 lg:col-span-2"
            },
            {
              icon: Brain,
              color: "text-purple-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Contextual Conversation Memory",
              desc: "Every chat session maintains its own distinct short-term and long-term memory. We automatically inject the entire chat history so the AI never loses context.",
              span: "col-span-1"
            },
            {
              icon: Shield,
              color: "text-emerald-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Enterprise-Grade Security",
              desc: "Secured by Firebase Authentication. Your chat histories, preferences, and session data are safely isolated in Firestore using robust backend security rules.",
              span: "col-span-1"
            },
            {
              icon: Code,
              color: "text-indigo-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Advanced Markdown Parsing",
              desc: "Code snippets, tables, and complex formatting are rendered flawlessly in real-time. Built-in syntax highlighting for over 40 programming languages with one-click copy functionality.",
              span: "md:col-span-2 lg:col-span-2"
            },
            {
              icon: Workflow,
              color: "text-orange-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Seamless Model Transitioning",
              desc: "Compare responses side-by-side, then click a single button to pivot your entire workflow into a focused chat with the winning model. The UI adapts instantly without page reloads.",
              span: "md:col-span-2 lg:col-span-2"
            },
            {
              icon: Cpu,
              color: "text-rose-500",
              bg: "bg-[var(--bg-primary)]",
              title: "Smart Simulation Mode",
              desc: "Testing without API keys? Our backend automatically falls back to a deterministic simulation engine that mimics LLM personas, allowing you to explore the UI risk-free.",
              span: "col-span-1"
            }
          ].map((feature, idx) => (
            <FadeIn key={idx} delay={idx * 0.1} className={feature.span}>
              <div className="glass-panel p-8 h-full flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-[var(--border-color)] ${feature.bg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
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

export default FeaturesPage;
