import React from 'react';
import { motion } from 'framer-motion';
import { useStaffCount, useResumeCount, useActiveStaffCount } from '../lib/useSupabase';
import { useTheme } from './ThemeProvider';
import { Users, Briefcase, UserCheck, TrendingUp, ArrowUpRight, ArrowDownRight, FileText, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DonutChart, TrendIndicator } from './ui/mini-charts';
import { ProgressRing, Sparkline } from './ui/progress-ring';
import { staggerContainer, fadeInUp } from '../lib/animations';

interface Props {
  onNav: (view: 'dashboard' | 'genzaix' | 'ukeoi' | 'ai' | 'resumes' | 'database') => void;
}

const Dashboard: React.FC<Props> = ({ onNav }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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

  // Sparkline data for trends
  const sparklineData = [28, 32, 35, 42, 48, 55, 62, 68, 75];
  const ukeoiSparkline = [15, 18, 22, 25, 30, 35, 40, 45, 55];

  // Donut chart data for staff distribution
  const staffDistribution = [
    { value: genzaixCount || 0, color: '#3b82f6', label: 'GenzaiX' },
    { value: ukeoiCount || 0, color: '#e2e8f0', label: 'Ukeoi' },
  ];

  return (
    <motion.div
      className={`flex-1 overflow-y-auto p-8 space-y-8 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Stats Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-yellow-600" size={24} />}
          label="GenzaiX Staff"
          value={genzaixCount || 0}
          trend="+4.2%"
          isPositive={true}
          onClick={() => onNav('genzaix')}
          color="yellow"
          isDark={isDark}
        />
        <StatCard
          icon={<Briefcase className="text-blue-600" size={24} />}
          label="Ukeoi Contractors"
          value={ukeoiCount || 0}
          trend="+12.5%"
          isPositive={true}
          onClick={() => onNav('ukeoi')}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          icon={<FileText className="text-cyan-600" size={24} />}
          label="Active CVs"
          value={resumeCount || 0}
          trend="+8.3%"
          isPositive={true}
          onClick={() => onNav('resumes')}
          color="cyan"
          isDark={isDark}
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
          isDark={isDark}
        />
      </motion.div>

      {/* Mini Charts Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff Distribution Donut */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Staff Distribution</h3>
          <div className="flex items-center justify-center">
            <DonutChart
              data={staffDistribution}
              size={120}
              strokeWidth={20}
              centerLabel={`${(genzaixCount || 0) + (ukeoiCount || 0)}`}
              centerSubLabel="Total"
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {staffDistribution.map((item, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* GenzaiX Trend */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>GenzaiX Trend</h3>
            <TrendIndicator value={12.5} />
          </div>
          <Sparkline data={sparklineData} height={80} color="#3b82f6" />
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last 9 months growth</p>
        </div>

        {/* Ukeoi Trend */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Ukeoi Trend</h3>
            <TrendIndicator value={8.3} />
          </div>
          <Sparkline data={ukeoiSparkline} height={80} color="#10b981" />
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last 9 months growth</p>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recruitment Trends */}
        <div className={`p-8 rounded-3xl shadow-sm border flex flex-col gap-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Operational Workforce</h3>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Hiring distribution over the last 6 months</p>
            </div>
            <div className="flex gap-4">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Internal
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} /> Ukeoi
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDark ? '#64748b' : '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDark ? '#64748b' : '#94a3b8'}} />
                <Tooltip
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b'}}
                />
                <Bar dataKey="genzaix" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="ukeoi" fill={isDark ? '#475569' : '#e2e8f0'} radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Analytics */}
        <div className={`p-8 rounded-3xl shadow-sm border flex flex-col gap-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
           <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Growth Projection</h3>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Accumulated headcount growth analysis</p>
            </div>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? 0.2 : 0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDark ? '#64748b' : '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDark ? '#64748b' : '#94a3b8'}} />
                <Tooltip
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b'}}
                />
                <Area type="monotone" dataKey="genzaix" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
  isDark?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, isPositive, onClick, color, customValue, isDark = false }) => {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-3xl shadow-sm border flex flex-col items-start gap-4 hover:shadow-md transition-all hover:translate-y-[-2px] text-left group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
    >
      <div className={`p-4 rounded-2xl transition-colors ${isDark ? 'bg-slate-700 group-hover:bg-slate-600' : `bg-slate-50 group-hover:bg-${color}-50`}`}>
        {icon}
      </div>
      <div className="w-full">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <div className="flex items-end justify-between">
          <h4 className={`text-3xl font-black tracking-tight ${customValue ? 'text-2xl' : ''} ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</h4>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${isPositive ? 'text-emerald-500' : 'text-rose-500'} ${isDark ? 'bg-slate-700' : 'bg-slate-50'} px-2.5 py-1 rounded-full`}>
            {isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
            {trend}
          </div>
        </div>
      </div>
    </button>
  );
};

export default Dashboard;
