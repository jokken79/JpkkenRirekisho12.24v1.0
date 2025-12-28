import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApplications, applicationService, resumeService, staffService } from '../lib/useSupabase';
import { useTheme } from './ThemeProvider';
import type { Application, Resume, Staff } from '../lib/database.types';
import { FileText, CheckCircle2, Clock, Building2, UserPlus, Trash2, Inbox } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import { ConfirmDialog } from './ui/confirm-dialog';
import { useToast } from './Toast';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './ui/empty-state';
import { staggerContainer, fadeInUp } from '../lib/animations';

// Skeleton for application card
const ApplicationCardSkeleton = ({ isDark = false }: { isDark?: boolean }) => (
  <div className={`rounded-3xl p-6 border flex items-center gap-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
    <Skeleton variant="rounded" className="w-16 h-16" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <Skeleton className="h-12 w-32 rounded-2xl" />
  </div>
);

type ApplicationWithResume = Application & { resume?: Resume };

const ApplicationList: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const allApplications = useApplications();
  const [applications, setApplications] = useState<ApplicationWithResume[]>([]);
  const { showToast } = useToast();

  // Dialog states
  const [hiringDialogOpen, setHiringDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetApp, setTargetApp] = useState<ApplicationWithResume | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch applications and join with resume data
  useEffect(() => {
    if (!allApplications) return;

    const fetchWithResumes = async () => {
      const joined = await Promise.all(
        allApplications.map(async (app) => {
          const resume = app.resume_id ? await resumeService.getById(app.resume_id) : null;
          return { ...app, resume: resume || undefined };
        })
      );
      setApplications(joined.reverse());
    };

    fetchWithResumes();
  }, [allApplications]);

  const openHiringDialog = (app: ApplicationWithResume) => {
    setTargetApp(app);
    setHiringDialogOpen(true);
  };

  const openDeleteDialog = (app: ApplicationWithResume) => {
    setTargetApp(app);
    setDeleteDialogOpen(true);
  };

  const finalizeHiring = async () => {
    if (!targetApp) return;
    setActionLoading(true);

    try {
      const newStaff: Partial<Staff> = {
        type: targetApp.type as any,
        status: 'Active',
        emp_id: targetApp.resume?.applicant_id || '',
        full_name: targetApp.resume?.full_name || '',
        furigana: targetApp.resume?.name_furigana || '',
        gender: targetApp.resume?.gender || '',
        birth_date: targetApp.resume?.birth_date,
        nationality: targetApp.resume?.nationality,
        address: targetApp.resume?.address,
        postal_code: targetApp.resume?.postal_code,
        mobile: targetApp.resume?.mobile,
        hire_date: targetApp.start_date,
        department: targetApp.department,
        dispatch_company: targetApp.factory_name,
        hourly_wage: targetApp.hourly_wage,
        billing_unit: targetApp.billing_unit,
        resume_id: targetApp.resume_id
      };

      // 1. Add to staff table
      await staffService.create(newStaff as any);

      // 2. Update application status to completed
      await applicationService.update(targetApp.id!, { status: 'completed', processed_at: new Date().toISOString() });

      showToast('Staff registered successfully!', 'success');
    } catch (e) {
      console.error('Error finalizing hiring:', e);
      showToast('Error finalizing hiring: ' + e, 'error');
    } finally {
      setActionLoading(false);
      setHiringDialogOpen(false);
      setTargetApp(null);
    }
  };

  const deleteApplication = async () => {
    if (!targetApp) return;
    setActionLoading(true);

    try {
      await applicationService.delete(targetApp.id!);
      showToast('Application deleted', 'success');
    } catch (e) {
      console.error('Error deleting application:', e);
      showToast('Error deleting application', 'error');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setTargetApp(null);
    }
  };

  // Loading state with skeleton
  if (!allApplications) {
    return (
      <div className={`flex-1 overflow-y-auto p-8 transition-colors ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ApplicationCardSkeleton key={i} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-6xl mx-auto space-y-6">

        <motion.div variants={fadeInUp} className="flex justify-between items-end mb-8">
           <div>
              <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>申請管理 (Applications)</h2>
              <p className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Manage pending hiring processes and onboarding.</p>
           </div>
           <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                 <Clock size={16} className="text-amber-500" />
                 <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{applications.filter(a => a.status !== 'completed').length} Pending</span>
              </div>
           </div>
        </motion.div>

        {applications.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <EmptyState
              icon={Inbox}
              title="No applications yet"
              description="Applications from the resume hiring flow will appear here."
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                className={`rounded-3xl p-6 border transition-all flex items-center gap-6 ${
                  app.status === 'completed'
                    ? isDark
                      ? 'opacity-60 grayscale bg-slate-800 border-slate-700'
                      : 'opacity-60 grayscale bg-white border-slate-100'
                    : isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-blue-700 shadow-sm hover:shadow-md'
                      : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >

                {/* Photo & Identity */}
                <div className="relative">
                   <AvatarDisplay
                     filename={app.resume?.legacy_raw ? (app.resume.legacy_raw as any)['写真'] : undefined}
                     alt={app.resume?.full_name || ''}
                     size="md"
                     className="rounded-2xl"
                   />
                   {app.status === 'completed' && (
                     <div className={`absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 ${isDark ? 'border-slate-800' : 'border-white'}`}>
                        <CheckCircle2 size={12} />
                     </div>
                   )}
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${app.type === 'GenzaiX' ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-50 text-cyan-600')}`}>
                         {app.type === 'GenzaiX' ? 'HAKEN (派遣)' : 'UKEOI (請負)'}
                      </span>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>ID: {app.resume?.applicant_id}</span>
                   </div>
                   <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{app.resume?.full_name}</h3>
                   <div className="flex items-center gap-4 mt-2">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                         <Building2 size={14} className={isDark ? 'text-slate-500' : 'text-slate-300'} />
                         {app.factory_name}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                         <Clock size={14} className={isDark ? 'text-slate-500' : 'text-slate-300'} />
                         Start: {app.start_date}
                      </div>
                   </div>
                </div>

                {/* Financials Summary */}
                <div className={`hidden md:flex flex-col items-end px-8 border-x gap-1 ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
                   <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>Hourly Wage</span>
                   <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-700'}`}>¥{app.hourly_wage?.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                   {app.status !== 'completed' ? (
                     <button
                       onClick={() => openHiringDialog(app)}
                       className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all whitespace-nowrap"
                     >
                        <UserPlus size={18} /> Register Staff
                     </button>
                   ) : (
                     <span className={`px-6 py-3 font-bold rounded-2xl flex items-center gap-2 ${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                        <CheckCircle2 size={18} /> Finalized
                     </span>
                   )}
                   <button
                     onClick={() => openDeleteDialog(app)}
                     className={`p-3 rounded-2xl transition-all ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                   >
                      <Trash2 size={20} />
                   </button>
                </div>

              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Hiring Confirmation Dialog */}
      <ConfirmDialog
        open={hiringDialogOpen}
        onOpenChange={setHiringDialogOpen}
        title="Confirm Staff Registration"
        description={`Register ${targetApp?.resume?.full_name || 'this applicant'} as an official staff member? This will create a new employee record.`}
        confirmLabel="Register Staff"
        cancelLabel="Cancel"
        variant="success"
        onConfirm={finalizeHiring}
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Application"
        description={`Are you sure you want to delete the application for ${targetApp?.resume?.full_name || 'this applicant'}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={deleteApplication}
        loading={actionLoading}
      />
    </motion.div>
  );
};

export default ApplicationList;
