
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Application, Rirekisho, StaffMember } from '../types';
import { FileText, CheckCircle2, Clock, Building2, UserPlus, Trash2 } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';

const ApplicationList: React.FC = () => {
  // Fetch applications joined with resume data
  const applications = useLiveQuery(async () => {
    const apps = await db.applications.toArray();
    const joined = await Promise.all(apps.map(async (app) => {
      const resume = await db.resumes.get(app.resumeId);
      return { ...app, resume };
    }));
    return joined.reverse();
  });

  const finalizeHiring = async (app: Application & { resume?: Rirekisho }) => {
    if (!confirm(`Confirm hiring for ${app.resume?.nameKanji}? This will create an official Staff record.`)) return;

    try {
      const newStaff: StaffMember = {
        type: app.type,
        status: 'Active',
        empId: app.resume?.applicantId || '',
        fullName: app.resume?.nameKanji || '',
        furigana: app.resume?.nameFurigana || '',
        gender: app.resume?.gender || '',
        birthDate: app.resume?.birthDate,
        nationality: app.resume?.nationality,
        address: app.resume?.address,
        postalCode: app.resume?.postalCode,
        mobile: app.resume?.mobile,
        hireDate: app.startDate,
        department: app.department,
        dispatchCompany: app.factoryName,
        hourlyWage: app.hourlyWage,
        billingUnit: app.billingUnit,
        resumeId: app.resumeId,
        createdAt: Date.now()
      };

      // 1. Add to staff table
      await db.staff.add(newStaff);
      
      // 2. Update application status to completed
      await db.applications.update(app.id!, { status: 'completed', processedAt: Date.now() });
      
      alert("Staff registered successfully!");
    } catch (e) {
      alert("Error finalizing hiring: " + e);
    }
  };

  const deleteApplication = async (id: number) => {
    if (confirm("Delete this application?")) await db.applications.delete(id);
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
                     filename={app.resume?.legacyRaw?.['写真']} 
                     alt={app.resume?.nameKanji || ''} 
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
                      <span className="text-[10px] font-bold text-slate-300">ID: {app.resume?.applicantId}</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 truncate">{app.resume?.nameKanji}</h3>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                         <Building2 size={14} className="text-slate-300" />
                         {app.factoryName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                         <Clock size={14} className="text-slate-300" />
                         Start: {app.startDate}
                      </div>
                   </div>
                </div>

                {/* Financials Summary */}
                <div className="hidden md:flex flex-col items-end px-8 border-x border-slate-50 gap-1">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Hourly Wage</span>
                   <span className="text-lg font-black text-slate-700">¥{app.hourlyWage?.toLocaleString()}</span>
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
