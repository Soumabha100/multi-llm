import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

const modalConfig = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10'
  },
  error: {
    icon: AlertCircle,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10'
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10'
  },
  info: {
    icon: Info,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10'
  }
};

const Modal = ({ isOpen, onClose, title, children, type = 'info' }) => {
  const modalRef = useClickOutside(onClose);
  const config = modalConfig[type] || modalConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgClass} ${config.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
