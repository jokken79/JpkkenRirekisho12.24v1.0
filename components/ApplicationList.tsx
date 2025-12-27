
import React, { useMemo, useState, useEffect } from 'react';
import { useApplications, applicationService, resumeService, staffService } from '../lib/useSupabase';
import type { Application, Resume, Staff } from '../lib/database.types';
import { FileText, CheckCircle2, Clock, Building2, UserPlus, Trash2 } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';

type ApplicationWithResume = Application & { resume?: Resume };

const ApplicationList: React.FC = () => {
  const allApplications = useApplications();
  const [applications, setApplications] = useState<ApplicationWithResume[]>([]);

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

  const finalizeHiring = async (app: ApplicationWithResume) => {
    if (!confirm(`Confirm hiring for ${app.resume?.full_name}? This will create an official Staff record.`)) return;

    try {
      const newStaff: Partial<Staff> = {
        type: app.type as any,
        status: 'Active',
        emp_id: app.resume?.applicant_id || '',
        full_name: app.resume?.full_name || '',
        furigana: app.resume?.name_furigana || '',
        gender: app.resume?.gender || '',
        birth_date: app.resume?.birth_date,
        nationality: app.resume?.nationality,
        address: app.resume?.address,
        postal_code: app.resume?.postal_code,
        mobile: app.resume?.mobile,
        hire_date: app.start_date,
        department: app.department,
        dispatch_company: app.factory_name,
        hourly_wage: app.hourly_wage,
        billing_unit: app.billing_unit,
        resume_id: app.resume_id
      };

      // 1. Add to staff table
      await staffService.create(newStaff as any);

      // 2. Update application status to completed
      await applicationService.update(app.id!, { status: 'completed', processed_at: new Date().toISOString() });

      alert("Staff registered successfully!");
    } catch (e) {
      alert("Error finalizing hiring: " + e);
    }
  };

  const deleteApplication = async (id: string) => {
    if (confirm("Delete this application?")) await applicationService.delete(id);
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
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${app.type === 'GenzaiX' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
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
                       onClick={() => finalizeHiring(app)}
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
                     onClick={() => deleteApplication(app.id!)}
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
    </div>
  );
};

export default ApplicationList;
