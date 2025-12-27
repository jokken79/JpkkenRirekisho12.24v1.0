
import React, { useMemo, useState, useEffect } from 'react';
import { useApplications, applicationService, resumeService, staffService } from '../lib/useSupabase';
import type { Application, Resume, Staff } from '../lib/database.types';
import { FileText, CheckCircle2, Clock, Building2, UserPlus, Trash2 } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import { ConfirmDialog } from './ui/confirm-dialog';
import { useToast } from './Toast';

type ApplicationWithResume = Application & { resume?: Resume };

const ApplicationList: React.FC = () => {
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

  if (!applications) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end mb-8">
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">申請管理 (Applications)</h2>
              <p className="text-slate-400 font-medium">Manage pending hiring processes and onboarding.</p>
           </div>
           <div className="flex gap-4">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                 <Clock size={16} className="text-amber-500" />
                 <span className="text-sm font-bold text-slate-600">{applications.filter(a => a.status !== 'completed').length} Pending</span>
              </div>
           </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 border border-dashed border-slate-200 text-center">
             <FileText size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">No active applications found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => (
              <div key={app.id} className={`bg-white rounded-3xl p-6 border transition-all flex items-center gap-6 ${app.status === 'completed' ? 'opacity-60 grayscale border-slate-100' : 'border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md'}`}>
                
                {/* Photo & Identity */}
                <div className="relative">
                   <AvatarDisplay
                     filename={app.resume?.legacy_raw ? (app.resume.legacy_raw as any)['写真'] : undefined}
                     alt={app.resume?.full_name || ''}
                     size="md"
                     className="rounded-2xl"
                   />
                   {app.status === 'completed' && (
                     <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-white">
                        <CheckCircle2 size={12} />
                     </div>
                   )}
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${app.type === 'GenzaiX' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600'}`}>
                         {app.type === 'GenzaiX' ? 'HAKEN (派遣)' : 'UKEOI (請負)'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">ID: {app.resume?.applicant_id}</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 truncate">{app.resume?.full_name}</h3>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                         <Building2 size={14} className="text-slate-300" />
                         {app.factory_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                         <Clock size={14} className="text-slate-300" />
                         Start: {app.start_date}
                      </div>
                   </div>
                </div>

                {/* Financials Summary */}
                <div className="hidden md:flex flex-col items-end px-8 border-x border-slate-50 gap-1">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Hourly Wage</span>
                   <span className="text-lg font-black text-slate-700">¥{app.hourly_wage?.toLocaleString()}</span>
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
                     <span className="px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-2xl flex items-center gap-2">
                        <CheckCircle2 size={18} /> Finalized
                     </span>
                   )}
                   <button
                     onClick={() => openDeleteDialog(app)}
                     className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                   >
                      <Trash2 size={20} />
                   </button>
                </div>

              </div>
            ))}
          </div>
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
    </div>
  );
};

export default ApplicationList;
