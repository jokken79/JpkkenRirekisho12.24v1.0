
import React from 'react';
import { useStaffCount, useResumeCount, useActiveStaffCount } from '../lib/useSupabase';
import { Users, Briefcase, UserCheck, TrendingUp, ArrowUpRight, ArrowDownRight, FileText, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  onNav: (view: 'dashboard' | 'genzaix' | 'ukeoi' | 'ai' | 'resumes' | 'database') => void;
}

const Dashboard: React.FC<Props> = ({ onNav }) => {
  const genzaixCount = useStaffCount('GenzaiX');
  const ukeoiCount = useStaffCount('Ukeoi');
  const activeStaff = useActiveStaffCount();
  const resumeCount = useResumeCount();

  const chartData = [
    { name: 'Jan', genzaix: 45, ukeoi: 32 },
    { name: 'Feb', genzaix: 52, ukeoi: 38 },
    { name: 'Mar', genzaix: 58, ukeoi: 45 },
    { name: 'Apr', genzaix: 62, ukeoi: 50 },
    { name: 'May', genzaix: 68, ukeoi: 55 },
    { name: 'Jun', genzaix: 75, ukeoi: 60 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-yellow-600" size={24} />}
          label="GenzaiX Staff"
          value={genzaixCount || 0}
          trend="+4.2%"
          isPositive={true}
          onClick={() => onNav('genzaix')}
          color="yellow"
        />
        <StatCard 
          icon={<Briefcase className="text-blue-600" size={24} />}
          label="Ukeoi Contractors"
          value={ukeoiCount || 0}
          trend="+12.5%"
          isPositive={true}
          onClick={() => onNav('ukeoi')}
          color="blue"
        />
        <StatCard 
          icon={<FileText className="text-purple-600" size={24} />}
          label="Active CVs"
          value={resumeCount || 0}
          trend="+8.3%"
          isPositive={true}
          onClick={() => onNav('resumes')}
          color="purple"
        />
        <StatCard 
          icon={<Database className="text-emerald-600" size={24} />}
          label="Sync Status"
          value="Healthy"
          customValue
          trend="Local"
          isPositive={true}
          onClick={() => onNav('database')}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recruitment Trends */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Operational Workforce</h3>
              <p className="text-xs text-slate-400 font-medium">Hiring distribution over the last 6 months</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Internal
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-slate-200" /> Ukeoi
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="genzaix" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="ukeoi" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Analytics */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
           <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Growth Projection</h3>
              <p className="text-xs text-slate-400 font-medium">Accumulated headcount growth analysis</p>
            </div>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}
                />
                <Area type="monotone" dataKey="genzaix" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend: string;
  isPositive: boolean;
  onClick: () => void;
  color: string;
  customValue?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, isPositive, onClick, color, customValue }) => {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-all hover:translate-y-[-2px] text-left group"
    >
      <div className={`p-4 rounded-2xl bg-slate-50 group-hover:bg-${color}-50 transition-colors`}>
        {icon}
      </div>
      <div className="w-full">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <h4 className={`text-3xl font-black text-slate-800 tracking-tight ${customValue ? 'text-2xl' : ''}`}>{value}</h4>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${isPositive ? 'text-emerald-600' : 'text-rose-600'} bg-slate-50 px-2.5 py-1 rounded-full`}>
            {isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
            {trend}
          </div>
        </div>
      </div>
    </button>
  );
};

export default Dashboard;
