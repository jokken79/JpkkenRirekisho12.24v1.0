
import React, { useState, useEffect } from 'react';
import { X, Save, ChevronRight, UserCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { StaffType, StaffMember, TableField } from '../types';
import { GENZAIX_FIELDS, UKEOI_FIELDS } from '../constants';
import { db } from '../db';
import { staffMemberSchema, validateForm } from '../lib/validation';
import { useToast } from './Toast';

interface Props {
  type: StaffType;
  member?: StaffMember;
  onClose: () => void;
}

const StaffForm: React.FC<Props> = ({ type, member, onClose }) => {
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    type: type,
    status: type === 'GenzaiX' ? 'Active' : 'Active',
    createdAt: Date.now()
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  const fields = type === 'GenzaiX' ? GENZAIX_FIELDS : UKEOI_FIELDS;

  // Group fields by section
  const sections = fields.reduce((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {} as Record<string, TableField[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const validation = validateForm(staffMemberSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (member?.id) {
        await db.staff.update(member.id, formData);
        toast.success('Personnel record updated successfully!');
      } else {
        await db.staff.add(formData as StaffMember);
        toast.success('New personnel record created!');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Error saving record. Please check data and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (key: string) => errors[key];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${type === 'GenzaiX' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
              <UserCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {member ? 'Edit Personnel' : `New ${type} Entry`}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Please fill in the details below accurately</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-white">
          <form id="staffForm" onSubmit={handleSubmit} className="space-y-10">
            {Object.entries(sections).map(([sectionName, sectionFields]) => (
              <div key={sectionName} className="relative">
                <div className="flex items-center gap-3 mb-6">
                   <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{sectionName}</h3>
                   <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {sectionFields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                      <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide px-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none ${
                            getFieldError(field.key) ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          value={String(formData[field.key] || '')}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        >
                          <option value="">Select Option</option>
                          {field.options?.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none ${
                            getFieldError(field.key) ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          value={String(formData[field.key] || '')}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
                            getFieldError(field.key) ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          value={String(formData[field.key] || '')}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      )}
                      {getFieldError(field.key) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {getFieldError(field.key)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 flex justify-end items-center gap-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel Changes
          </button>
          <button
            type="submit"
            form="staffForm"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={18} /> {member ? 'Update Record' : 'Save New Entry'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffForm;
