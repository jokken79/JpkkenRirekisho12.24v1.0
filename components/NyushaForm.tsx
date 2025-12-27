
import React, { useState } from 'react';
import { db } from '../db';
import { Rirekisho, Application, StaffType } from '../types';
import { Save, X, Building2, Landmark, Calendar, Banknote, UserCheck, AlertCircle } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import { applicationSchema, validateForm } from '../lib/validation';

interface Props {
  resume: Rirekisho;
  onClose: () => void;
}

const NyushaForm: React.FC<Props> = ({ resume, onClose }) => {
  const [formData, setFormData] = useState<Partial<Application>>({
    resumeId: resume.id,
    type: 'GenzaiX',
    status: 'draft',
    factoryName: '',
    department: '',
    hourlyWage: 0,
    billingUnit: 0,
    startDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveApplication = async () => {
    // Validate with Zod
    const validation = validateForm(applicationSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await db.applications.add(formData as Application);
      onClose();
    } catch (e) {
      setErrors({ submit: "Failed to save application: " + e });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fbfcfd] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                 <UserCheck size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-800">入社届 (Hiring Application)</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarding Process</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           
           {/* Candidate Summary */}
           <div className="flex items-center gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
              <AvatarDisplay 
                filename={resume.legacyRaw?.['写真']} 
                alt={resume.nameKanji} 
                size="lg" 
                className="rounded-2xl border-2 border-white shadow-md"
              />
              <div>
                 <h3 className="text-lg font-bold text-blue-900">{resume.nameKanji}</h3>
                 <p className="text-xs text-blue-600 font-medium">{resume.nameFurigana}</p>
                 <div className="mt-2 flex gap-2">
                    <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 border border-blue-100">ID: {resume.applicantId}</span>
                    <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 border border-blue-100">{resume.nationality}</span>
                 </div>
              </div>
           </div>

           {/* Deployment Info */}
           <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Building2 size={14} /> Deployment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contract Type (種類)</label>
                    <div className="flex gap-2">
                       {(['GenzaiX', 'Ukeoi'] as StaffType[]).map(t => (
                          <button 
                            key={t}
                            onClick={() => setFormData({...formData, type: t})}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.type === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                          >
                             {t === 'GenzaiX' ? '派遣 (Haken)' : '請負 (Ukeoi)'}
                          </button>
                       ))}
                    </div>
                 </div>
                 <InputGroup 
                    label="Start Date (入社日)" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup
                    label="Factory Name (派遣先/工場)"
                    placeholder="Enter factory name..."
                    value={formData.factoryName}
                    onChange={(e: any) => setFormData({...formData, factoryName: e.target.value})}
                    error={errors.factoryName}
                    required
                 />
                 <InputGroup
                    label="Department (配属先)"
                    placeholder="Manufacturing, QA, etc."
                    value={formData.department}
                    onChange={(e: any) => setFormData({...formData, department: e.target.value})}
                 />
              </div>
           </div>

           {/* Financials */}
           <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Banknote size={14} /> Financial Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Hourly Wage (時給)</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                       <input
                          type="number"
                          value={formData.hourlyWage || ''}
                          onChange={(e) => setFormData({...formData, hourlyWage: parseInt(e.target.value) || 0})}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                       />
                    </div>
                 </div>
                 <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Billing Unit (請求単価)</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                       <input
                          type="number"
                          value={formData.billingUnit || ''}
                          onChange={(e) => setFormData({...formData, billingUnit: parseInt(e.target.value) || 0})}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                       />
                    </div>
                 </div>
              </div>
           </div>

        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0 space-y-4">
           {errors.submit && (
             <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
               <AlertCircle size={16} /> {errors.submit}
             </div>
           )}
           <div className="flex gap-4">
             <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50">Cancel</button>
             <button
               onClick={saveApplication}
               disabled={isSubmitting}
               className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSubmitting ? (
                  <span className="animate-pulse">Saving...</span>
                ) : (
                  <><Save size={20} /> Create Hiring Application (申請)</>
                )}
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder, error, required }: any) => (
  <div className="flex-1 min-w-0">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 ${
        error ? 'border-red-400 bg-red-50' : 'border-slate-200'
      }`}
      placeholder={placeholder}
    />
    {error && (
      <p className="text-red-500 text-xs mt-1 px-1 flex items-center gap-1">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

export default NyushaForm;
