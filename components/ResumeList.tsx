import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useResumes, resumeService } from '../lib/useSupabase';
import type { Resume } from '../lib/database.types';
import { Trash2, Edit3, Calendar, Printer, ThumbsUp, ThumbsDown, Briefcase, FileText, Search } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import RirekishoPrintView from './RirekishoPrintView';
import NyushaForm from './NyushaForm';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './ui/empty-state';
import { staggerContainer, fadeInUp } from '../lib/animations';

// Skeleton for resume card
const ResumeCardSkeleton = () => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" className="w-16 h-16" />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton variant="rounded" className="h-16" />
      <Skeleton variant="rounded" className="h-16" />
    </div>
    <Skeleton className="h-4 w-full" />
  </div>
);

interface Props {
  searchTerm: string;
  onEdit: (resume: Resume) => void;
}

const ResumeList: React.FC<Props> = ({ searchTerm, onEdit }) => {
  const [printingResume, setPrintingResume] = useState<any | null>(null);
  const [hiringResume, setHiringResume] = useState<any | null>(null);
  const allResumes = useResumes();

  const filtered = useMemo(() => {
    if (!allResumes) return [];
    if (!searchTerm) return allResumes;
    const l = searchTerm.toLowerCase();
    return allResumes.filter(r =>
      (r.full_name && r.full_name.toLowerCase().includes(l)) ||
      (r.applicant_id && r.applicant_id.toLowerCase().includes(l))
    );
  }, [allResumes, searchTerm]);

  const handleDelete = async (id: string) => {
    if(confirm('Delete this resume?')) await resumeService.delete(id);
  };

  if (printingResume) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <RirekishoPrintView resume={printingResume} onClose={() => setPrintingResume(null)} />
      </div>
    );
  }

  // Loading state with skeleton
  if (!allResumes) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pb-24">
        {Array.from({ length: 6 }).map((_, i) => (
          <ResumeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pb-24"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {filtered.length === 0 ? (
        <div className="col-span-full">
          {searchTerm ? (
            <EmptyState
              icon={Search}
              title="No matching resumes"
              description={`No resumes found matching "${searchTerm}". Try adjusting your search.`}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No resumes yet"
              description="Get started by adding your first resume. Click the 'New Resume' button above."
              actionLabel="Add Resume"
              onAction={() => {}}
            />
          )}
        </div>
      ) : (
        filtered.map((r, index) => (
          <motion.div
            key={r.id}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col gap-6"
            variants={fadeInUp}
            custom={index}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Use new AvatarDisplay component */}
                <AvatarDisplay
                   filename={r.legacy_raw ? (r.legacy_raw as any)['写真'] : undefined}
                   alt={r.full_name || ''}
                   size="lg"
                   className="rounded-2xl border border-slate-100 bg-slate-50"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={r.full_name || ''}>{r.full_name}</h3>
                    {r.interview_result === 'passed' && <ThumbsUp size={14} className="text-emerald-500 fill-emerald-500" />}
                    {r.interview_result === 'failed' && <ThumbsDown size={14} className="text-rose-500 fill-rose-500" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.applicant_id}</p>
                  {r.legacy_raw && (
                    <span className="inline-block mt-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                      LEGACY
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {r.interview_result === 'passed' && (
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
                   {r.birth_date || 'N/A'}
                 </div>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                 <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   {r.interview_result === 'passed' ? 'Approved' : 'Available'}
                 </div>
               </div>
            </div>

            <div className="text-xs text-slate-400 font-medium flex justify-between items-center mt-auto">
              <span>Added {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</span>
              {r.address && <span className="max-w-[120px] truncate" title={r.address}>{r.address}</span>}
            </div>
          </motion.div>
        ))
      )}

      {/* Nyusha / Onboarding Form */}
      {hiringResume && (
        <NyushaForm
          resume={hiringResume}
          onClose={() => setHiringResume(null)}
        />
      )}
    </motion.div>
  );
};

export default ResumeList;
