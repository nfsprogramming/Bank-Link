import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
  // Prevent body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] flex max-h-[90vh] flex-col rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl md:hidden"
          >
            {/* Handle & Header */}
            <div className="shrink-0 rounded-t-3xl bg-surface px-6 pb-4 pt-3">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border-default/50" />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 hide-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
