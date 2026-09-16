import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap, ArrowRight } from 'lucide-react';

const ModelCard = ({ id, name, icon: Icon, colorClass, glowClass, response, isProcessing, onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-panel flex flex-col h-full overflow-hidden rounded-2xl border-t-[3px] shadow-lg transition-all duration-300 hover:shadow-xl ${colorClass} ${glowClass}`}
    >
      <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-4 bg-[var(--bg-secondary)]/50">
        <div className={`p-2.5 rounded-xl text-white shadow-sm ${colorClass.replace('border-t-', 'bg-')}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-bold text-lg leading-tight">{name}</h3>
          {response?.model && response.model !== "unknown" && (
            <div className="flex items-center mt-1">
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {response.model}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto scrollbar-thin">
        {isProcessing && !response ? (
          <div className="space-y-4">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-3/4"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-full"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-1/2"></div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-[var(--text-secondary)] text-sm leading-relaxed">
            {response?.status === 'error' ? (
              <div className="text-red-500 dark:text-red-400 font-medium">
                {response.error || "An error occurred."}
              </div>
            ) : (
              response?.response || "Waiting for response..."
            )}
          </div>
        )}
      </div>

      <div className="p-5 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)] mt-auto">
        <button
          onClick={() => onSelect(id, response?.response)}
          disabled={!response || isProcessing}
          className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-200
            bg-[var(--bg-primary)] hover:bg-white dark:hover:bg-gray-800 border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed group hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span>Continue with {name}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </motion.div>
  );
};

const MultiLLMPanel = ({ isProcessing, responses, onSelectModel }) => {
  const models = [
    { id: 'tokenharbor', name: 'Claude 3', icon: Bot, colorClass: 'border-t-[#1d4ed8] bg-[#1d4ed8]', glowClass: 'hover:shadow-[#1d4ed8]/10' },
    { id: 'openrouter', name: 'GPT-3.5', icon: Sparkles, colorClass: 'border-t-[#10a37f] bg-[#10a37f]', glowClass: 'hover:shadow-[#10a37f]/10' },
    { id: 'gemini', name: 'Gemini 3.6', icon: Zap, colorClass: 'border-t-[#8b5cf6] bg-[#8b5cf6]', glowClass: 'hover:shadow-[#8b5cf6]/10' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {models.map((model, idx) => (
        <motion.div 
          key={model.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="h-[500px]"
        >
          <ModelCard
            id={model.id}
            name={model.name}
            icon={model.icon}
            colorClass={model.colorClass}
            glowClass={model.glowClass}
            response={responses?.[model.id]}
            isProcessing={isProcessing}
            onSelect={onSelectModel}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default MultiLLMPanel;
