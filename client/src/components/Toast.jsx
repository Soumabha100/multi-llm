import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const toastConfig = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-green-500',
    borderClass: 'border-l-green-500',
    bgClass: 'bg-green-500/10'
  },
  error: {
    icon: AlertCircle,
    colorClass: 'text-red-500',
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-500/10'
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-amber-500',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-500/10'
  },
  info: {
    icon: Info,
    colorClass: 'text-blue-500',
    borderClass: 'border-l-blue-500',
    bgClass: 'bg-blue-500/10'
  }
};

const Toast = ({ toast }) => {
  const { removeToast } = useToast();
  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg rounded-xl overflow-hidden border-l-4 ${config.borderClass}`}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={`mt-0.5 ${config.colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-sm font-medium text-[var(--text-primary)]">
          {toast.message}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;
