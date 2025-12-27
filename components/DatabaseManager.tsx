
import React, { useState, useRef } from 'react';
import { Database, Download, ShieldCheck, RefreshCw, FileCode, Cloud, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { read, utils } from 'xlsx';
import { staffService, resumeService } from '../lib/dataService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useStaffCount, useResumeCount } from '../lib/useSupabase';

const DatabaseManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyFileInputRef = useRef<HTMLInputElement>(null);

  const staffCount = useStaffCount() || 0;
  const resumeCount = useResumeCount() || 0;
  const isConnected = isSupabaseConfigured();

  const excelDateToJSDate = (serial: number | string): string | undefined => {
    if (!serial) return undefined;
    if (typeof serial === 'string') return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  };

  // Import Excel file to Supabase
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);
    setImportStatus(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);

      const genzaiSheet = workbook.SheetNames.find(n => n.includes('GenzaiX'));
      const ukeoiSheet = workbook.SheetNames.find(n => n.includes('UkeoiX'));

      let importedCount = 0;

      if (genzaiSheet) {
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[genzaiSheet], { header: 1 });
        for (const row of rows.slice(1)) {
          if (!row[1]) continue;
          await staffService.create({
            type: 'GenzaiX',
            status: row[0] || 'Active',
            emp_id: String(row[1]),
            full_name: row[7] || '',
            full_name_kana: row[8] || '',
            gender: row[9] || '',
            nationality: row[10] || '',
            birth_date: excelDateToJSDate(row[11]),
            age: row[12],
            hourly_wage: row[13],
            billing_unit: row[15],
            profit_margin: row[17],
            standard_remuneration: row[18],
            health_ins: row[19],
            nursing_ins: row[20],
            pension: row[21],
            visa_expiry: excelDateToJSDate(row[22]),
            visa_type: row[24],
            postal_code: row[25],
            address: row[26],
            hire_date: excelDateToJSDate(row[29]),
            notes: row[34]
          });
          importedCount++;
        }
      }

      if (ukeoiSheet) {
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[ukeoiSheet], { header: 1 });
        for (const row of rows.slice(1)) {
          if (!row[1]) continue;
          await staffService.create({
            type: 'Ukeoi',
            status: row[0] || 'Active',
            emp_id: String(row[1]),
            full_name: row[3] || '',
            full_name_kana: row[4] || '',
            gender: row[5] || '',
            nationality: row[6] || '',
            birth_date: excelDateToJSDate(row[7]),
            age: row[8],
            hourly_wage: row[9],
            standard_remuneration: row[11],
            health_ins: row[12],
            nursing_ins: row[13],
            pension: row[14],
            profit_margin: row[17],
            visa_expiry: excelDateToJSDate(row[18]),
            visa_type: row[20],
            postal_code: row[21],
            address: row[22],
            hire_date: excelDateToJSDate(row[25]),
            bank_account_holder: row[29],
            bank_name: row[30],
            bank_account_number: row[33],
            notes: row[35]
          });
          importedCount++;
        }
      }

      if (importedCount > 0) {
        setImportStatus({ success: true, message: `${importedCount}件のスタッフデータをSupabaseにインポートしました！` });
      } else {
        setImportStatus({ success: false, message: 'Excelファイルに有効なデータが見つかりませんでした。' });
      }

    } catch (error: any) {
      console.error("Import failed:", error);
      setImportStatus({ success: false, message: `インポートエラー: ${error.message}` });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Import legacy JSON to Supabase
  const handleLegacyImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const legacyData = JSON.parse(text);

      if (!Array.isArray(legacyData)) {
        throw new Error('JSONファイルは配列形式である必要があります');
      }

      let importedCount = 0;

      for (const rec of legacyData) {
        // Build education from 最終学歴
        const education = rec['最終学歴'] ? [{ school: rec['最終学歴'], graduated: true }] : null;

        // Build job history from 職歴 fields
        const jobHistory = [];
        for (let i = 1; i <= 7; i++) {
          const company = rec[`職歴入社会社名${i}`];
          if (company) {
            jobHistory.push({
              company,
              startYear: rec[`職歴年入社${i}`] || '',
              startMonth: rec[`職歴月入社${i}`] || '',
              endYear: rec[`職歴年退社社${i}`] || '',
              endMonth: rec[`職歴月退社社${i}`] || ''
            });
          }
        }

        // Build family from 家族構成 fields
        const family = [];
        for (let i = 1; i <= 5; i++) {
          const name = rec[`家族構成氏名${i}`];
          if (name) {
            family.push({
              name,
              relationship: rec[`家族構成続柄${i}`] || '',
              age: rec[`年齢${i}`] || '',
              residence: rec[`居住${i}`] || ''
            });
          }
        }

        // Build licenses from certification fields
        const licenses = [];
        if (rec['ﾌｫｰｸﾘﾌﾄ免許']) licenses.push('フォークリフト');
        if (rec['玉掛']) licenses.push('玉掛');
        if (rec['移動式ｸﾚｰﾝ運転士(5ﾄﾝ未満)']) licenses.push('移動式クレーン(5t未満)');
        if (rec['移動式ｸﾚｰﾝ運転士(5ﾄﾝ以上)']) licenses.push('移動式クレーン(5t以上)');
        if (rec['ｶﾞｽ溶接作業者']) licenses.push('ガス溶接');

        await resumeService.create({
          applicant_id: String(rec['履歴書ID'] || ''),
          full_name: rec['氏名'] || 'Unknown',
          full_name_kana: rec['フリガナ'] || '',
          birth_date: rec['生年月日'] ? String(rec['生年月日']).split('T')[0] : null,
          gender: rec['性別'] || '',
          nationality: rec['国籍'] || '',
          postal_code: rec['郵便番号'] || '',
          address: `${rec['現住所'] || ''} ${rec['番地'] || ''} ${rec['物件名'] || ''}`.trim(),
          phone: rec['携帯電話'] || rec['電話番号'] || '',
          email: rec['email'] || null,
          photo: rec['写真'] || null,
          education: education,
          job_history: jobHistory.length > 0 ? jobHistory : null,
          licenses: licenses.length > 0 ? licenses : null,
          family: family.length > 0 ? family : null,
          skills: rec['特技'] || '',
          hobbies: rec['趣味'] || '',
          motivation: rec['志望動機'] || '',
          requests: rec['本人希望'] || null
        });
        importedCount++;
      }

      setImportStatus({ success: true, message: `${importedCount}件の履歴書データをSupabaseにインポートしました！` });

    } catch (error: any) {
      console.error("Import failed:", error);
      setImportStatus({ success: false, message: `インポートエラー: ${error.message}` });
    } finally {
      setIsImporting(false);
      if (legacyFileInputRef.current) legacyFileInputRef.current.value = '';
    }
  };

  // Export data from Supabase to JSON
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const staff = await staffService.getAll();
      const resumes = await resumeService.getAll();

      const exportData = {
        exportDate: new Date().toISOString(),
        staff,
        resumes
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staffhub-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setImportStatus({ success: true, message: 'データをエクスポートしました！' });
    } catch (err: any) {
      console.error(err);
      setImportStatus({ success: false, message: `エクスポートエラー: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-slate-50 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            データ管理
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Database Management</h2>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            Supabaseクラウドデータベースの管理。ファイルからデータをインポート、またはバックアップをエクスポート。
          </p>
        </div>

        {/* Status Message */}
        {importStatus && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${importStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {importStatus.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {importStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Excel Import Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500" />
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Excelインポート</h3>
              <p className="text-sm text-slate-400 px-4">UNS Master .xlsm/.xlsxファイルからスタッフデータをインポート</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelImport}
              className="hidden"
              accept=".xlsx, .xlsm, .xls"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || !isConnected}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isImporting || !isConnected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}
              `}
            >
              {isImporting ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
              {isImporting ? '処理中...' : 'ファイルを選択'}
            </button>
          </div>

          {/* Legacy JSON Import Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Database size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">履歴書JSONインポート</h3>
              <p className="text-sm text-slate-400 px-4">legacy_resumes.jsonなどの履歴書データをインポート</p>
            </div>
            <input
              type="file"
              ref={legacyFileInputRef}
              onChange={handleLegacyImport}
              className="hidden"
              accept=".json"
            />
            <button
              onClick={() => legacyFileInputRef.current?.click()}
              disabled={isImporting || !isConnected}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isImporting || !isConnected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'}
              `}
            >
              {isImporting ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
              {isImporting ? '処理中...' : 'JSONを選択'}
            </button>
          </div>

          {/* Export Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
              <FileCode size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">バックアップ</h3>
              <p className="text-sm text-slate-400 px-4">全データをJSONファイルとしてダウンロード</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || !isConnected}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isExporting || !isConnected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}
              `}
            >
              {isExporting ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
              {isExporting ? 'エクスポート中...' : 'ダウンロード'}
            </button>
          </div>

          {/* Connection Status Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className={`w-20 h-20 ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} rounded-3xl flex items-center justify-center`}>
              <Cloud size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">接続状態</h3>
              <p className="text-sm text-slate-400 px-4">Supabaseクラウドデータベース</p>
            </div>
            <div className="w-full p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 mt-auto space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {isConnected ? 'CONNECTED' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">スタッフ</span>
                <span className="font-bold text-slate-700">{staffCount}件</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">履歴書</span>
                <span className="font-bold text-slate-700">{resumeCount}件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;
