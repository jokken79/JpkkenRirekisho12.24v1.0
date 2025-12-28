import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'data' | 'search' | 'upload' | 'users';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      {/* Icon with floating animation */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
        className="relative mb-6"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-150" />

        {/* Icon container */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
          <Icon className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <motion.button
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
        >
          {action.label}
        </motion.button>
      )}

      {/* Decorative dots */}
      <div className="flex items-center gap-2 mt-8">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-2 h-2 rounded-full bg-slate-300"
          />
        ))}
      </div>
    </motion.div>
  );
};

// Preset empty states for common scenarios
export const NoResultsFound: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <EmptyState
    icon={require('lucide-react').Search}
    title="No results found"
    description="We couldn't find any records matching your search criteria. Try adjusting your filters or search terms."
    action={onReset ? {
      label: 'Clear Filters',
      onClick: onReset
    } : undefined}
  />
);

export const NoDataYet: React.FC<{ onAdd?: () => void; entityName?: string }> = ({
  onAdd,
  entityName = 'items'
}) => (
  <EmptyState
    icon={require('lucide-react').Database}
    title={`No ${entityName} yet`}
    description={`Get started by adding your first ${entityName}. All your data will be stored locally and securely.`}
    action={onAdd ? {
      label: `Add ${entityName}`,
      onClick: onAdd
    } : undefined}
  />
);

export const UploadPrompt: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={require('lucide-react').Upload}
    title="Upload your data"
    description="Import existing employee data from CSV or Excel files. We support multiple formats and will guide you through the process."
    action={{
      label: 'Choose File',
      onClick: onUpload
    }}
  />
);
