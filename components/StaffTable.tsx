
import React, { useState, useEffect, useMemo } from 'react';
import { useStaff, staffService } from '../lib/useSupabase';
import { StaffType, StaffMember, TableField } from '../types';
import { GENZAIX_FIELDS, UKEOI_FIELDS } from '../constants';
import { Trash2, Edit3, MoreHorizontal, Database } from 'lucide-react';
import type { Staff } from '../lib/database.types';

// Convert camelCase to snake_case for Supabase field access
const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Get value from row using either camelCase or snake_case key
const getRowValue = (row: any, key: string): any => {
  return row[key] ?? row[toSnakeCase(key)] ?? '-';
};

interface Props {
  type: StaffType;
  searchTerm: string;
  onEdit: (member: StaffMember) => void;
}

const StaffTable: React.FC<Props> = ({ type, searchTerm, onEdit }) => {
  const allStaff = useStaff(type);

  const fields = type === 'GenzaiX' ? GENZAIX_FIELDS : UKEOI_FIELDS;

  const filteredData = useMemo(() => {
    if (!allStaff) return [];
    if (!searchTerm) return allStaff;
    const lower = searchTerm.toLowerCase();
    return allStaff.filter(s =>
      (s.full_name && s.full_name.toLowerCase().includes(lower)) ||
      (s.emp_id && s.emp_id.toLowerCase().includes(lower)) ||
      (s.phone && s.phone.toLowerCase().includes(lower))
    );
  }, [allStaff, searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record permanently?')) {
      await staffService.delete(id);
    }
  };

  if (!allStaff) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading database...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-auto relative p-6">
        <div className="min-w-max bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="sticky left-0 bg-slate-50 z-30 px-4 py-4 w-16 text-center border-r border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">#</span>
                </th>
                {fields.map((f, i) => (
                  <th 
                    key={f.key}
                    className={`
                      px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200
                      ${f.frozen ? 'sticky z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                    `}
                    style={f.frozen ? { left: i === 0 ? '4rem' : '10rem' } : {}}
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 sticky right-0 z-20 border-l border-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 2} className="py-24 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Database size={48} className="opacity-10" />
                      <p className="font-medium text-slate-400">No records found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 group transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 text-center py-4 border-r border-slate-100 font-mono text-[10px] text-slate-400">
                      {idx + 1}
                    </td>
                    {fields.map((f, i) => (
                      <td 
                        key={f.key}
                        className={`
                          px-6 py-4 text-sm text-slate-600 border-r border-slate-100 whitespace-nowrap max-w-[200px] truncate
                          ${f.frozen ? 'sticky z-10 bg-white group-hover:bg-blue-50/30 border-r-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                        `}
                        style={f.frozen ? { left: i === 0 ? '4rem' : '10rem' } : {}}
                      >
                        {String(getRowValue(row, f.key))}
                      </td>
                    ))}
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-blue-50/30 py-4 px-4 text-center border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(row)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(row.id!)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="group-hover:hidden">
                        <MoreHorizontal size={16} className="text-slate-300 mx-auto" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffTable;
