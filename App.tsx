
import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
  Bot,
  FileText,
  User as UserIcon
} from 'lucide-react';
import { StaffType, StaffMember, Rirekisho } from './types';
import { db } from './db';
import StaffTable from './components/StaffTable';
import StaffForm from './components/StaffForm';
import RirekishoForm from './components/RirekishoForm';
import Dashboard from './components/Dashboard';
import AISummary from './components/AISummary';
import DatabaseManager from './components/DatabaseManager';
import UserProfile from './components/UserProfile';
import { APP_LOGO } from './constants';
import ResumeList from './components/ResumeList';
import ApplicationList from './components/ApplicationList';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'genzaix' | 'ukeoi' | 'ai' | 'resumes' | 'applications' | 'database' | 'profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | undefined>(undefined);
  const [editingResume, setEditingResume] = useState<Rirekisho | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const currentUser = useLiveQuery(() => db.settings.get('current_user'));

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

  const currentType: StaffType = activeView === 'genzaix' ? 'GenzaiX' : 'Ukeoi';

  const userInitials = useMemo(() => {
    if (!currentUser?.displayName) return '??';
    return currentUser.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 no-print`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100 h-20">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
             <img src={APP_LOGO} alt="Logo" className="h-10 object-contain" />
             <div className="flex flex-col">
               <span className="text-xl font-bold text-blue-900 tracking-tight">StaffHub</span>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise v2</span>
             </div>
          </div>
          {!isSidebarOpen && <img src={APP_LOGO} alt="Logo" className="h-8 w-8 object-contain" />}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            collapsed={!isSidebarOpen}
          />
          <div className="pt-4 pb-2 px-3">
             <span className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ${!isSidebarOpen && 'hidden'}`}>Personnel</span>
             {!isSidebarOpen && <div className="h-px bg-slate-100" />}
          </div>
          <SidebarItem 
            icon={<Users size={20} />} 
            label="GenzaiX (Internal)" 
            active={activeView === 'genzaix'} 
            onClick={() => setActiveView('genzaix')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Briefcase size={20} />} 
            label="Ukeoi (Contract)" 
            active={activeView === 'ukeoi'} 
            onClick={() => setActiveView('ukeoi')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Resumes (CV)" 
            active={activeView === 'resumes'} 
            onClick={() => setActiveView('resumes')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<FileText size={20} className="text-orange-500" />} 
            label="Solicitudes (申請)" 
            active={activeView === 'applications'} 
            onClick={() => setActiveView('applications')}
            collapsed={!isSidebarOpen}
          />
           <div className="pt-4 pb-2 px-3">
             <span className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ${!isSidebarOpen && 'hidden'}`}>Intelligence</span>
             {!isSidebarOpen && <div className="h-px bg-slate-100" />}
          </div>
          <SidebarItem 
            icon={<Bot size={20} />} 
            label="AI Insights" 
            active={activeView === 'ai'} 
            onClick={() => setActiveView('ai')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Database size={20} />} 
            label="Database Hub" 
            active={activeView === 'database'} 
            onClick={() => setActiveView('database')}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <SidebarItem 
            icon={<UserIcon size={20} />} 
            label="My Profile" 
            active={activeView === 'profile'} 
            onClick={() => setActiveView('profile')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={false}
            onClick={() => {}}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Sign Out" 
            active={false} 
            onClick={() => {}}
            collapsed={!isSidebarOpen}
            textColor="text-red-500"
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-30 no-print">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {activeView === 'dashboard' ? 'Overview' : activeView === 'resumes' ? 'Applicant Resumes' : activeView === 'database' ? 'Database Management' : activeView === 'profile' ? 'User Profile' : activeView.replace('ai', 'AI Insights')}
            </h1>
            {['genzaix', 'ukeoi', 'resumes'].includes(activeView) && (
               <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeView}...`}
                  className="pl-10 pr-4 py-2 w-72 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
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
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
             >
                <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold overflow-hidden">
                   {currentUser?.avatar ? (
                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Profile" />
                   ) : userInitials}
                </div>
                <div className="text-left hidden lg:block">
                   <p className="text-sm font-bold text-slate-800 leading-none mb-0.5">{currentUser?.displayName || 'Loading...'}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser?.role || 'User'}</p>
                </div>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
           {activeView === 'dashboard' && <Dashboard onNav={setActiveView} />}
           {(activeView === 'genzaix' || activeView === 'ukeoi') && (
              <StaffTable type={currentType} searchTerm={searchTerm} onEdit={handleEditStaff} />
           )}
           {activeView === 'resumes' && <ResumeList searchTerm={searchTerm} onEdit={handleEditResume} />}
           {activeView === 'applications' && <ApplicationList />}
           {activeView === 'ai' && <AISummary />}
           {activeView === 'database' && <DatabaseManager />}
           {activeView === 'profile' && <UserProfile />}
        </div>
      </main>

      {showStaffForm && <StaffForm type={currentType} member={editingMember} onClose={() => setShowStaffForm(false)} />}
      {showResumeForm && <RirekishoForm resume={editingResume} onClose={() => setShowResumeForm(false)} />}
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
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, collapsed, textColor }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group
        ${active ? 'bg-blue-50 text-blue-700 font-semibold' : `hover:bg-slate-50 ${textColor || 'text-slate-500'}`}
      `}
    >
      <div className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
        {icon}
      </div>
      {!collapsed && <span className="text-sm truncate">{label}</span>}
      {active && !collapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600" />}
      {collapsed && (
        <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
};

export default App;
