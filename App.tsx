
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Plus,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart3,
  FileText,
  User as UserIcon,
  Loader2,
  Menu,
  X,
  Download,
  Command,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from './components/ThemeProvider';
import { StaffType, StaffMember, Rirekisho } from './types';
import { useCurrentUserProfile } from './lib/useSupabase';
import { signOut } from './lib/supabase';
import { APP_LOGO } from './constants';
import { CommandPalette, createDefaultCommands } from './components/ui/command-palette';
import { Fab } from './components/ui/fab';
import { pageVariants } from './lib/animations';

// Lazy load components for code splitting
const StaffTable = lazy(() => import('./components/StaffTable'));
const StaffForm = lazy(() => import('./components/StaffForm'));
const RirekishoForm = lazy(() => import('./components/RirekishoForm'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const StatsDashboard = lazy(() => import('./components/StatsDashboard'));
const DatabaseManager = lazy(() => import('./components/DatabaseManager'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const ResumeList = lazy(() => import('./components/ResumeList'));
const ApplicationList = lazy(() => import('./components/ApplicationList'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
    </div>
  </div>
);

type ViewType = 'dashboard' | 'genzaix' | 'ukeoi' | 'stats' | 'resumes' | 'applications' | 'database' | 'profile';

// Map routes to view names
const routeToView: Record<string, ViewType> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/genzaix': 'genzaix',
  '/ukeoi': 'ukeoi',
  '/resumes': 'resumes',
  '/applications': 'applications',
  '/stats': 'stats',
  '/database': 'database',
  '/profile': 'profile',
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Derive activeView from current route
  const activeView: ViewType = routeToView[location.pathname] || 'dashboard';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | undefined>(undefined);
  const [editingResume, setEditingResume] = useState<Rirekisho | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const currentUser = useCurrentUserProfile();

  const handleAddStaff = () => {
    setEditingMember(undefined);
    setShowStaffForm(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingMember(member);
    setShowStaffForm(true);
  };

  const handleAddResume = () => {
    setEditingResume(undefined);
    setShowResumeForm(true);
  };

  const handleEditResume = (resume: Rirekisho) => {
    setEditingResume(resume);
    setShowResumeForm(true);
  };

  // Command palette commands
  const commands = useMemo(() => createDefaultCommands(
    (path) => navigate(`/${path}`),
    {
      addStaff: handleAddStaff,
      addResume: handleAddResume,
      exportData: () => navigate('/database'),
    }
  ), [navigate]);

  // Keyboard shortcut for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FAB actions for quick access
  const fabActions = useMemo(() => [
    { icon: <Users size={20} />, label: 'Add GenzaiX', onClick: () => { navigate('/genzaix'); handleAddStaff(); } },
    { icon: <Briefcase size={20} />, label: 'Add Ukeoi', onClick: () => { navigate('/ukeoi'); handleAddStaff(); } },
    { icon: <FileText size={20} />, label: 'New Resume', onClick: handleAddResume },
    { icon: <Download size={20} />, label: 'Export DB', onClick: () => navigate('/database') },
  ], [navigate]);

  const currentType: StaffType = activeView === 'genzaix' ? 'GenzaiX' : 'Ukeoi';

  // Navigation helper that uses React Router
  const setActiveView = (view: ViewType) => {
    navigate(`/${view === 'dashboard' ? '' : view}`);
  };

  const userInitials = useMemo(() => {
    if (!currentUser?.display_name) return '??';
    return currentUser.display_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Close mobile menu when navigating
  const handleMobileNavigation = (view: ViewType) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
        border-r transition-all duration-300 flex flex-col z-50 no-print
        fixed lg:relative inset-y-0 left-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-4 flex items-center justify-between border-b h-20 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'lg:hidden'}`}>
             <img src={APP_LOGO} alt="Logo" className="h-10 object-contain" />
             <div className="flex flex-col">
               <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>StaffHub</span>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Enterprise v2</span>
             </div>
          </div>
          {!isSidebarOpen && <img src={APP_LOGO} alt="Logo" className="h-8 w-8 object-contain hidden lg:block" />}
          {/* Desktop collapse button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg hidden lg:block ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`p-1.5 rounded-lg lg:hidden ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-4">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeView === 'dashboard'}
            onClick={() => handleMobileNavigation('dashboard')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <div className="pt-4 pb-2 px-3">
             <span className={`text-[10px] font-bold uppercase tracking-widest ${!isSidebarOpen && 'hidden'} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Personnel</span>
             {!isSidebarOpen && <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />}
          </div>
          <SidebarItem
            icon={<Users size={20} />}
            label="GenzaiX (Internal)"
            active={activeView === 'genzaix'}
            onClick={() => handleMobileNavigation('genzaix')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <SidebarItem
            icon={<Briefcase size={20} />}
            label="Ukeoi (Contract)"
            active={activeView === 'ukeoi'}
            onClick={() => handleMobileNavigation('ukeoi')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Resumes (CV)"
            active={activeView === 'resumes'}
            onClick={() => handleMobileNavigation('resumes')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <SidebarItem
            icon={<FileText size={20} className="text-orange-500" />}
            label="Solicitudes (申請)"
            active={activeView === 'applications'}
            onClick={() => handleMobileNavigation('applications')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
           <div className="pt-4 pb-2 px-3">
             <span className={`text-[10px] font-bold uppercase tracking-widest ${!isSidebarOpen && 'hidden'} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Analytics</span>
             {!isSidebarOpen && <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />}
          </div>
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Statistics"
            active={activeView === 'stats'}
            onClick={() => handleMobileNavigation('stats')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <SidebarItem
            icon={<Database size={20} />}
            label="Database Hub"
            active={activeView === 'database'}
            onClick={() => handleMobileNavigation('database')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
        </nav>

        <div className={`p-3 border-t space-y-1 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <SidebarItem
            icon={<UserIcon size={20} />}
            label="My Profile"
            active={activeView === 'profile'}
            onClick={() => handleMobileNavigation('profile')}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          {/* Dark Mode Toggle */}
          <SidebarItem
            icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
            label={isDark ? 'Light Mode' : 'Dark Mode'}
            active={false}
            onClick={toggleTheme}
            collapsed={!isSidebarOpen}
            isDark={isDark}
          />
          <SidebarItem
            icon={<LogOut size={20} />}
            label="Sign Out"
            active={false}
            onClick={handleSignOut}
            collapsed={!isSidebarOpen}
            textColor="text-red-500"
            isDark={isDark}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-20 px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-sm z-30 no-print border-b transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-lg lg:hidden ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Menu size={24} />
            </button>
            <h1 className={`text-lg lg:text-xl font-bold capitalize ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {activeView === 'dashboard' ? 'Overview' : activeView === 'resumes' ? 'Applicant Resumes' : activeView === 'database' ? 'Database Management' : activeView === 'profile' ? 'User Profile' : activeView === 'stats' ? 'Statistics & KPIs' : activeView}
            </h1>
            {['genzaix', 'ukeoi', 'resumes'].includes(activeView) && (
               <div className="relative group hidden md:block">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
                <input
                  type="text"
                  placeholder={`Search ${activeView}...`}
                  className={`pl-10 pr-4 py-2 w-48 lg:w-72 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             {/* Keyboard shortcut hint */}
             <button
               onClick={() => setCommandPaletteOpen(true)}
               className={`hidden lg:flex items-center gap-2 px-3 py-2 text-sm border rounded-xl transition-all ${isDark ? 'text-slate-400 bg-slate-700 hover:bg-slate-600 border-slate-600' : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border-slate-200'}`}
             >
               <Command size={14} />
               <span className="text-xs">Press</span>
               <kbd className={`px-1.5 py-0.5 border rounded text-[10px] font-mono font-bold ${isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'}`}>Ctrl+K</kbd>
             </button>

             {activeView === 'resumes' ? (
                <button
                  onClick={handleAddResume}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus size={18} />
                  New Resume
                </button>
             ) : (activeView === 'genzaix' || activeView === 'ukeoi') && (
                <button
                  onClick={handleAddStaff}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus size={18} />
                  Add Personnel
                </button>
             )}
             
             <button
                onClick={() => setActiveView('profile')}
                className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-colors border border-transparent ${isDark ? 'hover:bg-slate-700 hover:border-slate-600' : 'hover:bg-slate-100 hover:border-slate-200'}`}
             >
                <div className={`w-10 h-10 rounded-full bg-blue-600 border-2 shadow-sm flex items-center justify-center text-white font-bold overflow-hidden ${isDark ? 'border-slate-700' : 'border-white'}`}>
                   {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                   ) : userInitials}
                </div>
                <div className="text-left hidden lg:block">
                   <p className={`text-sm font-bold leading-none mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentUser?.display_name || 'Loading...'}</p>
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentUser?.role || 'User'}</p>
                </div>
             </button>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              className="flex-1 overflow-hidden"
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard onNav={setActiveView} />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/genzaix" element={<StaffTable type="GenzaiX" searchTerm={searchTerm} onEdit={handleEditStaff} />} />
                <Route path="/ukeoi" element={<StaffTable type="Ukeoi" searchTerm={searchTerm} onEdit={handleEditStaff} />} />
                <Route path="/resumes" element={<ResumeList searchTerm={searchTerm} onEdit={handleEditResume} />} />
                <Route path="/applications" element={<ApplicationList />} />
                <Route path="/stats" element={<StatsDashboard />} />
                <Route path="/database" element={<DatabaseManager />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {showStaffForm && <StaffForm type={currentType} member={editingMember} onClose={() => setShowStaffForm(false)} />}
        {showResumeForm && <RirekishoForm resume={editingResume} onClose={() => setShowResumeForm(false)} />}
      </Suspense>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        commands={commands}
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Floating Action Button */}
      <Fab actions={fabActions} />
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  textColor?: string;
  isDark?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, collapsed, textColor, isDark = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group
        ${active
          ? isDark
            ? 'bg-blue-900/50 text-blue-400 font-semibold'
            : 'bg-blue-50 text-blue-700 font-semibold'
          : isDark
            ? `hover:bg-slate-700 ${textColor || 'text-slate-400'}`
            : `hover:bg-slate-50 ${textColor || 'text-slate-500'}`
        }
      `}
    >
      <div className={`${active ? 'text-blue-500' : isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
        {icon}
      </div>
      {!collapsed && <span className="text-sm truncate">{label}</span>}
      {active && !collapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500" />}
      {collapsed && (
        <div className={`absolute left-16 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white'}`}>
          {label}
        </div>
      )}
    </button>
  );
};

export default App;
