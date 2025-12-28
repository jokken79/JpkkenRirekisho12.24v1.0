import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, FileText, Download, Upload } from 'lucide-react';
import { cn } from '../../lib/cn';

interface FabAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FabProps {
  actions: FabAction[];
  position?: 'bottom-right' | 'bottom-left';
}

export const Fab: React.FC<FabProps> = ({
  actions,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3 mb-4"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { delay: index * 0.05, type: 'spring', stiffness: 300 }
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  y: 20,
                  transition: { delay: (actions.length - index - 1) * 0.03 }
                }}
                className="flex items-center gap-3 justify-end"
              >
                {/* Label */}
                <motion.span
                  whileHover={{ x: -4 }}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-lg whitespace-nowrap"
                >
                  {action.label}
                </motion.span>

                {/* Action Button */}
                <motion.button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
                    'bg-white text-slate-700 hover:shadow-xl transition-shadow',
                    action.color || 'bg-blue-500 text-white'
                  )}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'w-16 h-16 rounded-full shadow-xl flex items-center justify-center',
          'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
          'relative overflow-hidden'
        )}
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity" />

        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Usage example for StaffHub
export const StaffHubFab: React.FC<{
  onAddStaff: () => void;
  onAddResume: () => void;
  onExport: () => void;
}> = ({ onAddStaff, onAddResume, onExport }) => {
  const actions: FabAction[] = [
    {
      id: 'add-staff',
      label: 'Add Staff Member',
      icon: <Users className="w-5 h-5" />,
      onClick: onAddStaff,
    },
    {
      id: 'add-resume',
      label: 'Create Resume',
      icon: <FileText className="w-5 h-5" />,
      onClick: onAddResume,
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: <Download className="w-5 h-5" />,
      onClick: onExport,
    },
  ];

  return <Fab actions={actions} />;
};
