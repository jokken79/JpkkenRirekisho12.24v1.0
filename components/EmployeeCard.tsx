
import React from 'react';
import {
  Briefcase,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { StaffMember } from '../types';
import AvatarDisplay from './AvatarDisplay';

interface EmployeeCardProps {
  employee: StaffMember;
  variant?: 'compact' | 'default' | 'detailed';
  onClick?: (employee: StaffMember) => void;
  showFinancials?: boolean;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  variant = 'default',
  onClick,
  showFinancials = false,
  className = ''
}) => {
  // Calculate visa status
  const getVisaStatus = () => {
    if (!employee.visaExpiry) return null;
    const expiry = new Date(employee.visaExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: 'expired', label: '期限切れ', color: 'text-red-600 bg-red-50' };
    if (daysUntilExpiry < 30) return { status: 'urgent', label: `${daysUntilExpiry}日`, color: 'text-orange-600 bg-orange-50' };
    if (daysUntilExpiry < 90) return { status: 'warning', label: `${daysUntilExpiry}日`, color: 'text-yellow-600 bg-yellow-50' };
    return { status: 'ok', label: '有効', color: 'text-green-600 bg-green-50' };
  };

  const visaStatus = getVisaStatus();

  // Staff type badge colors
  const typeColors = {
    GenzaiX: 'bg-blue-100 text-blue-800 border-blue-200',
    Ukeoi: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  // Status badge
  const statusColors: Record<string, string> = {
    '現在': 'bg-green-100 text-green-800',
    '退職': 'bg-gray-100 text-gray-500',
    '休職': 'bg-yellow-100 text-yellow-800'
  };

  const baseClasses = `
    bg-white rounded-lg border border-slate-200
    hover:border-blue-300 hover:shadow-md
    transition-all duration-200
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  // Compact variant - minimal info
  if (variant === 'compact') {
    return (
      <div
        className={`${baseClasses} p-3 flex items-center gap-3`}
        onClick={() => onClick?.(employee)}
      >
        <AvatarDisplay filename={employee.avatar} alt={employee.fullName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{employee.fullName}</p>
          <p className="text-xs text-slate-500 truncate">{employee.dispatchCompany || employee.department || '-'}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[employee.type]}`}>
          {employee.type === 'GenzaiX' ? '派遣' : '請負'}
        </span>
      </div>
    );
  }

  // Default variant
  if (variant === 'default') {
    return (
      <div
        className={`${baseClasses} p-4`}
        onClick={() => onClick?.(employee)}
      >
        <div className="flex items-start gap-4">
          <AvatarDisplay filename={employee.avatar} alt={employee.fullName} size="lg" />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-slate-900 truncate">{employee.fullName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[employee.status] || 'bg-gray-100'}`}>
                {employee.status}
              </span>
            </div>

            {/* Furigana & ID */}
            <p className="text-sm text-slate-500 mb-2">
              {employee.furigana && <span className="mr-2">{employee.furigana}</span>}
              <span className="text-slate-400">#{employee.empId}</span>
            </p>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Briefcase size={14} className="text-slate-400" />
                <span className="truncate">{employee.dispatchCompany || employee.department || '-'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                <span className="truncate">{employee.nationality || '-'}</span>
              </div>

              {employee.hireDate && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{employee.hireDate}</span>
                </div>
              )}

              {visaStatus && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${visaStatus.color}`}>
                  {visaStatus.status === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span className="text-xs">ビザ: {visaStatus.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Type badge */}
          <span className={`text-xs px-2 py-1 rounded border shrink-0 ${typeColors[employee.type]}`}>
            {employee.type === 'GenzaiX' ? '派遣' : '請負'}
          </span>
        </div>

        {/* Financial info (optional) */}
        {showFinancials && employee.hourlyWage && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <CreditCard size={14} className="text-slate-400" />
              <span>時給: ¥{employee.hourlyWage.toLocaleString()}</span>
            </div>
            {employee.billingUnit && (
              <div className="text-slate-600">
                請求: ¥{employee.billingUnit.toLocaleString()}
              </div>
            )}
            {employee.profitMargin && (
              <div className="text-green-600 font-medium">
                +¥{employee.profitMargin.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - full info
  return (
    <div
      className={`${baseClasses} p-5`}
      onClick={() => onClick?.(employee)}
    >
      {/* Header section */}
      <div className="flex items-start gap-4 mb-4">
        <AvatarDisplay filename={employee.avatar} alt={employee.fullName} size="xl" />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-xl text-slate-900">{employee.fullName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[employee.type]}`}>
              {employee.type === 'GenzaiX' ? '派遣' : '請負'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[employee.status] || 'bg-gray-100'}`}>
              {employee.status}
            </span>
          </div>

          <p className="text-slate-500 mb-2">
            {employee.furigana} • #{employee.empId}
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {employee.nationality && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {employee.nationality}
              </span>
            )}
            {employee.gender && <span>{employee.gender}</span>}
            {employee.age && <span>{employee.age}歳</span>}
          </div>
        </div>

        {/* Visa status */}
        {visaStatus && (
          <div className={`px-3 py-2 rounded-lg ${visaStatus.color}`}>
            <div className="flex items-center gap-1.5">
              {visaStatus.status === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="font-medium">ビザ</span>
            </div>
            <p className="text-xs mt-0.5">{visaStatus.label}</p>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Work info */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700 flex items-center gap-1.5">
            <Briefcase size={14} /> 勤務情報
          </h4>
          <div className="pl-5 space-y-1 text-slate-600">
            <p><span className="text-slate-400">派遣先:</span> {employee.dispatchCompany || '-'}</p>
            <p><span className="text-slate-400">部署:</span> {employee.department || '-'}</p>
            <p><span className="text-slate-400">業務:</span> {employee.jobContent || '-'}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} /> 日程
          </h4>
          <div className="pl-5 space-y-1 text-slate-600">
            <p><span className="text-slate-400">入社日:</span> {employee.hireDate || '-'}</p>
            <p><span className="text-slate-400">ビザ期限:</span> {employee.visaExpiry || '-'}</p>
            <p><span className="text-slate-400">ビザ種類:</span> {employee.visaType || '-'}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700 flex items-center gap-1.5">
            <Phone size={14} /> 連絡先
          </h4>
          <div className="pl-5 space-y-1 text-slate-600">
            <p><span className="text-slate-400">〒:</span> {employee.postalCode || '-'}</p>
            <p><span className="text-slate-400">住所:</span> {employee.address || '-'}</p>
          </div>
        </div>

        {/* Financial (if enabled) */}
        {showFinancials && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-700 flex items-center gap-1.5">
              <CreditCard size={14} /> 給与情報
            </h4>
            <div className="pl-5 space-y-1 text-slate-600">
              <p><span className="text-slate-400">時給:</span> ¥{employee.hourlyWage?.toLocaleString() || '-'}</p>
              <p><span className="text-slate-400">請求:</span> ¥{employee.billingUnit?.toLocaleString() || '-'}</p>
              <p className="text-green-600">
                <span className="text-slate-400">利益:</span> ¥{employee.profitMargin?.toLocaleString() || '-'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;
