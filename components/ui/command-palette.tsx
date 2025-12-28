import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  Database,
  Settings,
  Plus,
  TrendingUp,
  Download,
  Upload,
  Edit3,
  Trash2,
  X,
  Command,
} from 'lucide-react';
import { cn } from '../../lib/cn';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'data';
}

interface CommandPaletteProps {
  commands: Command[];
  onNavigate?: (view: string) => void;
  onAction?: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  onNavigate,
  onAction
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Open/close with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }

      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const query = search.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    );
  }, [search, commands]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyNav = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-lg font-medium"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Command List */}
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {Object.entries(groupedCommands).length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-slate-400 font-medium">No commands found</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, cmds], groupIndex) => (
                    <div key={category}>
                      {groupIndex > 0 && <div className="h-px bg-slate-100 my-2 mx-4" />}

                      <div className="px-4 py-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                          {category}
                        </p>
                      </div>

                      {cmds.map((cmd, cmdIndex) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={cmd.id}
                            onClick={() => {
                              cmd.action();
                              setIsOpen(false);
                              setSearch('');
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            whileHover={{ x: 4 }}
                            className={cn(
                              'w-full flex items-center gap-3 px-6 py-3 transition-all',
                              isSelected
                                ? 'bg-blue-50 text-blue-900'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg transition-colors',
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                            )}>
                              {cmd.icon}
                            </div>

                            <span className="flex-1 text-left font-medium">
                              {cmd.label}
                            </span>

                            {cmd.shortcut && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                                {cmd.shortcut}
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Command className="w-3 h-3" />
                  <span className="font-medium">+K to open</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Default command set for StaffHub
export const createDefaultCommands = (
  navigate: (view: string) => void,
  actions: { addStaff: () => void; addResume: () => void; exportData: () => void; }
): Command[] => [
  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Go to Dashboard',
    icon: <BarChart3 className="w-4 h-4" />,
    shortcut: 'G D',
    category: 'navigation',
    action: () => navigate('dashboard'),
  },
  {
    id: 'nav-genzaix',
    label: 'Go to GenzaiX Staff',
    icon: <Users className="w-4 h-4" />,
    shortcut: 'G G',
    category: 'navigation',
    action: () => navigate('genzaix'),
  },
  {
    id: 'nav-ukeoi',
    label: 'Go to Ukeoi Contractors',
    icon: <Briefcase className="w-4 h-4" />,
    shortcut: 'G U',
    category: 'navigation',
    action: () => navigate('ukeoi'),
  },
  {
    id: 'nav-resumes',
    label: 'Go to Resumes',
    icon: <FileText className="w-4 h-4" />,
    shortcut: 'G R',
    category: 'navigation',
    action: () => navigate('resumes'),
  },
  {
    id: 'nav-database',
    label: 'Go to Database Manager',
    icon: <Database className="w-4 h-4" />,
    shortcut: 'G D',
    category: 'navigation',
    action: () => navigate('database'),
  },

  // Actions
  {
    id: 'action-add-staff',
    label: 'Add New Staff Member',
    icon: <Plus className="w-4 h-4" />,
    shortcut: 'N S',
    category: 'actions',
    action: actions.addStaff,
  },
  {
    id: 'action-add-resume',
    label: 'Create New Resume',
    icon: <FileText className="w-4 h-4" />,
    shortcut: 'N R',
    category: 'actions',
    action: actions.addResume,
  },

  // Data operations
  {
    id: 'data-export',
    label: 'Export Data to CSV',
    icon: <Download className="w-4 h-4" />,
    category: 'data',
    action: actions.exportData,
  },
];
