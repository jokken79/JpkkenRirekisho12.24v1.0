
import React, { useState, useRef } from 'react';
import { Database, Download, ShieldCheck, RefreshCw, FileCode, HardDrive, Upload, FileSpreadsheet } from 'lucide-react';
import { exportToSQLite } from '../services/sqliteService';
import { read, utils } from 'xlsx';
import { db } from '../db';
import { StaffMember } from '../types';

const DatabaseManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToSQLite();
    } catch (err) {
      console.error(err);
      alert("Failed to generate SQLite file.");
    } finally {
      setIsExporting(false);
    }
  };

  const excelDateToJSDate = (serial: number | string): string | undefined => {
    if (!serial) return undefined;
    if (typeof serial === 'string') return serial; // Already a string
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      
      const genzaiSheet = workbook.SheetNames.find(n => n.includes('GenzaiX'));
      const ukeoiSheet = workbook.SheetNames.find(n => n.includes('UkeoiX'));
      
      const newStaff: StaffMember[] = [];

      if (genzaiSheet) {
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[genzaiSheet], { header: 1 });
        // Skip header (row 0), start from row 1
        rows.slice(1).forEach(row => {
            if (!row[1]) return; // Skip empty rows (check EmpID)
            newStaff.push({
                type: 'GenzaiX',
                status: row[0],
                empId: String(row[1]),
                dispatchId: row[2],
                dispatchCompany: row[3],
                department: row[4],
                line: row[5],
                jobContent: row[6],
                fullName: row[7],
                furigana: row[8],
                gender: row[9],
                nationality: row[10],
                birthDate: excelDateToJSDate(row[11]),
                age: row[12],
                hourlyWage: row[13],
                wageRevision: row[14],
                billingUnit: row[15],
                billingRevision: row[16],
                profitMargin: row[17],
                standardRemuneration: row[18],
                healthIns: row[19],
                nursingIns: row[20],
                pension: row[21],
                visaExpiry: excelDateToJSDate(row[22]),
                visaAlert: row[23],
                visaType: row[24],
                postalCode: row[25],
                address: row[26],
                apartment: row[27],
                moveInDate: excelDateToJSDate(row[28]),
                hireDate: excelDateToJSDate(row[29]),
                resignDate: excelDateToJSDate(row[30]),
                moveOutDate: excelDateToJSDate(row[31]),
                socialInsStatus: row[32],
                hireRequest: row[33],
                remarks: row[34],
                currentHireDate: excelDateToJSDate(row[35]),
                licenseType: row[36],
                licenseExpiry: excelDateToJSDate(row[37]),
                commuteMethod: row[38],
                voluntaryInsExpiry: excelDateToJSDate(row[39]),
                japaneseLevel: row[40],
                careerUp5: row[41],
                companyName: row[3], // Fallback
                position: row[6], // Fallback
                createdAt: Date.now()
            });
        });
      }

      if (ukeoiSheet) {
        const rows: any[][] = utils.sheet_to_json(workbook.Sheets[ukeoiSheet], { header: 1 });
        rows.slice(1).forEach(row => {
             if (!row[1]) return;
             newStaff.push({
                type: 'Ukeoi',
                status: row[0],
                empId: String(row[1]),
                contractWork: row[2],
                fullName: row[3],
                furigana: row[4],
                gender: row[5],
                nationality: row[6],
                birthDate: excelDateToJSDate(row[7]),
                age: row[8],
                hourlyWage: row[9],
                wageRevision: row[10],
                standardRemuneration: row[11],
                healthIns: row[12],
                nursingIns: row[13],
                pension: row[14],
                commuteDist: row[15],
                transportationCost: row[16],
                profitMargin: row[17],
                visaExpiry: excelDateToJSDate(row[18]),
                visaAlert: row[19],
                visaType: row[20],
                postalCode: row[21],
                address: row[22],
                apartment: row[23],
                moveInDate: excelDateToJSDate(row[24]),
                hireDate: excelDateToJSDate(row[25]),
                resignDate: excelDateToJSDate(row[26]),
                moveOutDate: excelDateToJSDate(row[27]),
                socialInsStatus: row[28],
                bankAccountHolder: row[29],
                bankName: row[30],
                branchNum: row[31],
                branchName: row[32],
                accountNum: row[33],
                hireRequest: row[34],
                remarks: row[35],
                companyName: "UNS Ukeoi", // Fallback
                createdAt: Date.now()
             });
        });
      }

      if (newStaff.length > 0) {
        await db.staff.bulkAdd(newStaff);
        alert(`Successfully imported ${newStaff.length} staff records!`);
      } else {
        alert("No valid records found in the selected Excel file.");
      }

    } catch (error) {
      console.error("Import failed:", error);
      alert("Error processing file. Please ensure it is a valid .xlsm/.xlsx file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-slate-50 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Data Integrity Guard
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Database Management</h2>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            Manage your local IndexedDB storage, import legacy data, and export your entire workforce database.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Excel Import Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500" />
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Import Master Excel</h3>
              <p className="text-sm text-slate-400 px-4">Import staff data from the UNS Master .xlsm file (GenzaiX/UkeoiX).</p>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".xlsx, .xlsm, .xls"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isImporting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}
              `}
            >
              {isImporting ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
              {isImporting ? 'Parsing Excel...' : 'Select File'}
            </button>
          </div>

          {/* Legacy Access Import Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Database size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Legacy Access DB</h3>
              <p className="text-sm text-slate-400 px-4">Import 1000+ resumes from the old Access database (legacy_resumes.json).</p>
            </div>
            <button 
              onClick={async () => {
                if (!confirm("This will import/update data from 'public/legacy_resumes_fixed.json'. Continue?")) return;
                setIsImporting(true);
                try {
                   // Try to fetch the fixed version first, fallback to original if not found
                   let response = await fetch('/legacy_resumes_fixed.json');
                   if (!response.ok) {
                      console.warn("Fixed JSON not found, trying original...");
                      response = await fetch('/legacy_resumes.json');
                   }
                   
                   if (!response.ok) throw new Error("Data file not found. Please run the migration scripts.");
                   const legacyData = await response.json();
                   
                   const newResumes = legacyData.map((rec: any) => ({
                      applicantId: String(rec['履歴書ID'] || ''),
                      nameKanji: rec['氏名'] || 'Unknown',
                      nameFurigana: rec['フリガナ'] || '',
                      birthDate: rec['生年月日'] ? rec['生年月日'].split('T')[0] : '',
                      gender: rec['性別'] || '',
                      nationality: rec['国籍'] || '',
                      postalCode: rec['郵便番号'] || '',
                      address: `${rec['現住所'] || ''} ${rec['番地'] || ''} ${rec['物件名'] || ''}`.trim(),
                      mobile: rec['携帯電話'] || rec['電話番号'] || '',
                      phone: rec['電話番号'] || '',
                      visaType: rec['在留資格'] || '', // Check exact key in legacy data
                      visaPeriod: rec['在留期間'] || '',
                      residenceCardNo: rec['在留カード番号'] || '',
                      spouse: rec['配偶者'] || '',
                      height: rec['身長'] ? String(rec['身長']) : '',
                      weight: rec['体重'] ? String(rec['体重']) : '',
                      shoeSize: rec['靴サイズ'] ? String(rec['靴サイズ']) : '',
                      
                      // Store EVERYTHING else in legacyRaw to ensure no data loss as requested
                      legacyRaw: rec,
                      createdAt: Date.now()
                   }));

                   // Use bulkPut to update existing records instead of failing on duplicates
                   await db.resumes.bulkPut(newResumes);
                   alert(`Successfully imported/updated ${newResumes.length} legacy resumes!`);

                } catch (e) {
                   console.error(e);
                   alert("Import failed: " + e);
                } finally {
                   setIsImporting(false);
                }
              }}
              disabled={isImporting}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isImporting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'}
              `}
            >
              {isImporting ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
              {isImporting ? 'Importing...' : 'Load Legacy Data'}
            </button>
          </div>

          {/* SQLite Export Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
              <FileCode size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Export to SQLite</h3>
              <p className="text-sm text-slate-400 px-4">Generate a standard .db file compatible with DB Browser for SQLite.</p>
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={`
                w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                ${isExporting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}
              `}
            >
              {isExporting ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
              {isExporting ? 'Generating...' : 'Download .db'}
            </button>
          </div>

          {/* Local Storage Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center">
              <HardDrive size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Storage Info</h3>
              <p className="text-sm text-slate-400 px-4">Local storage is persistent. Data is safely stored in your browser.</p>
            </div>
            <div className="w-full p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 mt-auto">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Database</span>
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">DEXIE_IDB</span>
               </div>
               <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Database size={14} className="text-slate-400" />
                  StaffHubDB v4.0
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;
