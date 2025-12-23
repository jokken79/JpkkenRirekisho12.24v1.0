import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Rirekisho } from '../types';
import { Trash2, Edit3, User, Database, Calendar, Printer, ThumbsUp, ThumbsDown, Briefcase } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import RirekishoPrintView from './RirekishoPrintView';
import NyushaForm from './NyushaForm';

interface Props {
  searchTerm: string;
  onEdit: (resume: Rirekisho) => void;
}

const ResumeList: React.FC<Props> = ({ searchTerm, onEdit }) => {
  const [printingResume, setPrintingResume] = useState<Rirekisho | null>(null);
  const [hiringResume, setHiringResume] = useState<Rirekisho | null>(null);
  const allResumes = useLiveQuery(() => db.resumes.reverse().toArray());

  const filtered = useMemo(() => {
    if (!allResumes) return [];
    if (!searchTerm) return allResumes;
    const l = searchTerm.toLowerCase();
    return allResumes.filter(r => 
      r.nameKanji.toLowerCase().includes(l) || 
      r.applicantId.toLowerCase().includes(l)
    );
  }, [allResumes, searchTerm]);

  const handleDelete = async (id: number) => {
    if(confirm('Delete this resume?')) await db.resumes.delete(id);
  };

  if (printingResume) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <RirekishoPrintView resume={printingResume} onClose={() => setPrintingResume(null)} />
      </div>
    );
  }

  if (!allResumes) return null;

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pb-24">
      {filtered.length === 0 ? (
        <div className="col-span-full py-32 text-center text-slate-400">
           <Database size={48} className="mx-auto mb-4 opacity-10" />
           <p className="font-medium">No resumes found</p>
        </div>
      ) : (
        filtered.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Use new AvatarDisplay component */}
                <AvatarDisplay 
                   filename={r.legacyRaw ? r.legacyRaw['写真'] : undefined} 
                   alt={r.nameKanji} 
                   size="lg"
                   className="rounded-2xl border border-slate-100 bg-slate-50"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={r.nameKanji}>{r.nameKanji}</h3>
                    {r.interviewResult === 'passed' && <ThumbsUp size={14} className="text-emerald-500 fill-emerald-500" />}
                    {r.interviewResult === 'failed' && <ThumbsDown size={14} className="text-rose-500 fill-rose-500" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.applicantId}</p>
                  {r.legacyRaw && (
                    <span className="inline-block mt-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                      LEGACY
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {r.interviewResult === 'passed' && (
                  <button 
                    onClick={() => setHiringResume(r)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                    title="Start Hiring Process (申請)"
                  >
                    <Briefcase size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setPrintingResume(r)}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                  title="Print Resume"
                >
                  <Printer size={16} />
                </button>
                <button onClick={() => onEdit(r)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(r.id!)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-xl">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Birth Date</p>
                 <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                   <Calendar size={12} className="text-slate-400" />
                   {r.birthDate || 'N/A'}
                 </div>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                 <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   {r.interviewResult === 'passed' ? 'Approved' : 'Available'}
                 </div>
               </div>
            </div>

            <div className="text-xs text-slate-400 font-medium flex justify-between items-center mt-auto">
              <span>Added {new Date(r.createdAt).toLocaleDateString()}</span>
              {r.address && <span className="max-w-[120px] truncate" title={r.address}>{r.address}</span>}
            </div>
          </div>
        ))
      )}
      
      {/* Nyusha / Onboarding Form */}
      {hiringResume && (
        <NyushaForm 
          resume={hiringResume} 
          onClose={() => setHiringResume(null)} 
        />
      )}
    </div>
  );
};

export default ResumeList;
