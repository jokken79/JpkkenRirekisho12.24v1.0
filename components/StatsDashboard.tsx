import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton, SkeletonCard, SkeletonChart } from './ui/skeleton';
import { fadeInUp, staggerContainer, cardHover } from '../lib/animations';

// Animated counter component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Metric card component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  delay?: number;
}

function MetricCard({ title, value, icon, trend, color, delay = 0 }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      whileHover={cardHover.whileHover}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-900">
                <AnimatedCounter value={value} />
              </p>
              {trend && (
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-medium ${
                      trend.isUp ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isUp ? '+' : '-'}{Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-slate-400">vs last month</span>
                </div>
              )}
            </div>
            <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Chart colors
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  slate: '#64748b',
};

export default function StatsDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all staff data
  const staff = useLiveQuery(() => db.staff.toArray(), []);
  const resumes = useLiveQuery(() => db.resumes.toArray(), []);
  const factories = useLiveQuery(() => db.factories.toArray(), []);

  const isLoading = !staff || !resumes || !factories;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!staff) return null;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Active staff (not resigned)
    const activeStaff = staff.filter(s => s.status !== '退社' && s.status !== '退職');

    // GenzaiX vs Ukeoi
    const genzaixCount = activeStaff.filter(s => s.type === 'GenzaiX').length;
    const ukeoiCount = activeStaff.filter(s => s.type === 'Ukeoi').length;

    // Visa expiring soon
    const visasExpiringSoon = activeStaff.filter(s => {
      if (!s.visaExpiry) return false;
      const expiryDate = new Date(s.visaExpiry);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    });

    // New hires this month
    const newHiresThisMonth = staff.filter(s => {
      if (!s.hireDate) return false;
      const hireDate = new Date(s.hireDate);
      return hireDate >= oneMonthAgo;
    });

    // By factory/department
    const byDepartment = activeStaff.reduce((acc, s) => {
      const dept = s.department || s.dispatchCompany || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly hiring trend (last 6 months)
    const hiringTrend: { month: string; hires: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('ja-JP', { month: 'short' });

      const hires = staff.filter(s => {
        if (!s.hireDate) return false;
        const hireDate = new Date(s.hireDate);
        return hireDate >= monthStart && hireDate <= monthEnd;
      }).length;

      hiringTrend.push({ month: monthName, hires });
    }

    // By nationality
    const byNationality = activeStaff.reduce((acc, s) => {
      const nat = s.nationality || 'Unknown';
      acc[nat] = (acc[nat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const byStatus = staff.reduce((acc, s) => {
      const status = s.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActive: activeStaff.length,
      genzaixCount,
      ukeoiCount,
      visasExpiringSoon: visasExpiringSoon.length,
      visasExpiringList: visasExpiringSoon.slice(0, 5),
      newHiresThisMonth: newHiresThisMonth.length,
      byDepartment,
      hiringTrend,
      byNationality,
      byStatus,
      typeRatio: [
        { name: 'GenzaiX', value: genzaixCount, color: COLORS.blue },
        { name: 'Ukeoi', value: ukeoiCount, color: COLORS.emerald },
      ],
      departmentData: Object.entries(byDepartment)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name: name.length > 10 ? name.slice(0, 10) + '...' : name, value })),
    };
  }, [staff]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statistics Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time overview of your workforce</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Active Employees"
          value={stats.totalActive}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          delay={0}
        />
        <MetricCard
          title="New Hires (This Month)"
          value={stats.newHiresThisMonth}
          icon={<UserPlus className="h-6 w-6" />}
          trend={{ value: 12, isUp: true }}
          color="emerald"
          delay={0.1}
        />
        <MetricCard
          title="Visas Expiring (30 days)"
          value={stats.visasExpiringSoon}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={stats.visasExpiringSoon > 0 ? 'amber' : 'emerald'}
          delay={0.2}
        />
        <MetricCard
          title="Active Resumes"
          value={resumes?.length || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring Trend Chart */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-500" />
                Hiring Trend (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.hiringTrend}>
                  <defs>
                    <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hires"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    fill="url(#colorHires)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employee Type Distribution */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500" />
                Employee Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.typeRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.typeRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-4">
                  {stats.typeRatio.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{item.value}</p>
                        <p className="text-xs text-slate-500">
                          {((item.value / stats.totalActive) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* By Department */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-500" />
                Employees by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={COLORS.blue}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Visa Alerts */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Visa Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.visasExpiringList.length > 0 ? (
                <div className="space-y-3">
                  {stats.visasExpiringList.map((staff, index) => (
                    <div
                      key={staff.id || index}
                      className="flex items-center justify-between rounded-lg bg-amber-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{staff.fullName}</p>
                        <p className="text-xs text-slate-500">
                          Expires: {staff.visaExpiry}
                        </p>
                      </div>
                      <Badge variant="warning" size="sm">
                        {Math.ceil(
                          (new Date(staff.visaExpiry!).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </Badge>
                    </div>
                  ))}
                  {stats.visasExpiringSoon > 5 && (
                    <button className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                      View all {stats.visasExpiringSoon} alerts
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-emerald-100 p-3 mb-3">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-medium text-slate-900">All Clear!</p>
                  <p className="text-sm text-slate-500">
                    No visas expiring in the next 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(stats.byStatus).slice(0, 6).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
