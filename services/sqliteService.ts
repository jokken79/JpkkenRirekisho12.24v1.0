
import initSqlJs from "sql.js";
import { staffService, resumeService, applicationService, factoryService } from "../lib/useSupabase";

// Helper function to safely parse integers (prevents NaN)
const safeParseInt = (value: any): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

export const exportToSQLite = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `https://esm.sh/sql.js@1.12.0/dist/${file}`
  });

  const sqlDb = new SQL.Database();

  // Create Staff Table (EXPANDED to include all critical fields)
  sqlDb.run(`
    CREATE TABLE staff (
      id INTEGER PRIMARY KEY,
      type TEXT,
      empId TEXT,
      fullName TEXT,
      furigana TEXT,
      status TEXT,
      gender TEXT,
      nationality TEXT,
      birthDate TEXT,
      age INTEGER,
      department TEXT,
      dispatchId TEXT,
      dispatchCompany TEXT,
      contractWork TEXT,
      hourlyWage INTEGER,
      billingUnit INTEGER,
      profitMargin INTEGER,
      standardRemuneration INTEGER,
      healthIns TEXT,
      nursingIns TEXT,
      pension TEXT,
      socialInsStatus TEXT,
      visaExpiry TEXT,
      visaType TEXT,
      postalCode TEXT,
      address TEXT,
      apartment TEXT,
      isShaku INTEGER,
      hireDate TEXT,
      resignDate TEXT,
      bankAccountHolder TEXT,
      bankName TEXT,
      branchNum TEXT,
      branchName TEXT,
      accountNum TEXT,
      remarks TEXT,
      resumeId INTEGER,
      createdAt INTEGER
    )
  `);

  // Create Resumes Table (Comprehensive)
  sqlDb.run(`
    CREATE TABLE resumes (
      id INTEGER PRIMARY KEY,
      applicantId TEXT,
      nameKanji TEXT,
      nameFurigana TEXT,
      birthDate TEXT,
      age INTEGER,
      gender TEXT,
      nationality TEXT,
      address TEXT,
      postalCode TEXT,
      mobile TEXT,
      visaType TEXT,
      visaPeriod TEXT,
      residenceCardNo TEXT,
      height TEXT,
      weight TEXT,
      educationLevel TEXT,
      jobHistory TEXT, -- JSON String
      family TEXT, -- JSON String
      interviewResult TEXT,
      reasonForApplying TEXT,
      selfPR TEXT,
      createdAt INTEGER
    )
  `);

  // Create Applications Table (NEW - was missing!)
  sqlDb.run(`
    CREATE TABLE applications (
      id INTEGER PRIMARY KEY,
      resumeId INTEGER,
      status TEXT,
      type TEXT,
      factoryName TEXT,
      department TEXT,
      hourlyWage INTEGER,
      billingUnit INTEGER,
      startDate TEXT,
      notes TEXT,
      createdAt INTEGER,
      processedAt INTEGER
    )
  `);

  // Create Factories Table (NEW - was missing!)
  sqlDb.run(`
    CREATE TABLE factories (
      id INTEGER PRIMARY KEY,
      name TEXT,
      location TEXT,
      contact TEXT
    )
  `);

  // Fetch data from Supabase
  const staff = await staffService.getAll();
  const resumes = await resumeService.getAll();
  const applications = await applicationService.getAll();
  const factories = await factoryService.getAll();

  // Insert Staff (EXPANDED with all critical fields) - using snake_case from Supabase
  staff.forEach(s => {
    sqlDb.run(
      `INSERT INTO staff (
        id, type, empId, fullName, furigana, status, gender, nationality, birthDate, age,
        department, dispatchId, dispatchCompany, contractWork, hourlyWage, billingUnit,
        profitMargin, standardRemuneration, healthIns, nursingIns, pension, socialInsStatus,
        visaExpiry, visaType, postalCode, address, apartment, isShaku, hireDate, resignDate,
        bankAccountHolder, bankName, branchNum, branchName, accountNum, remarks, resumeId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.type, s.emp_id, s.full_name, s.furigana, s.status, s.gender, s.nationality, s.birth_date, safeParseInt(s.age),
        s.department, s.dispatch_id, s.dispatch_company, s.contract_work, safeParseInt(s.hourly_wage), safeParseInt(s.billing_unit),
        safeParseInt(s.profit_margin), safeParseInt(s.standard_remuneration), String(s.health_ins || ''), String(s.nursing_ins || ''), String(s.pension || ''), s.social_ins_status,
        s.visa_expiry, s.visa_type, s.postal_code, s.address, s.apartment, s.is_shaku ? 1 : 0, s.hire_date, s.resign_date,
        s.bank_account_holder, s.bank_name, s.branch_num, s.branch_name, s.account_num, s.remarks, s.resume_id, s.created_at
      ]
    );
  });

  // Insert Resumes (with safeParseInt for age) - using snake_case from Supabase
  resumes.forEach(r => {
    sqlDb.run(
      `INSERT INTO resumes (
        id, applicantId, nameKanji, nameFurigana, birthDate, age, gender, nationality, address,
        postalCode, mobile, visaType, visaPeriod, residenceCardNo, height, weight,
        educationLevel, jobHistory, family, interviewResult, reasonForApplying, selfPR, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.applicant_id, r.name_kanji || r.full_name, r.name_furigana, r.birth_date, safeParseInt(r.age), r.gender, r.nationality, r.address,
        r.postal_code, r.mobile || r.phone, r.visa_type, r.visa_period, r.residence_card_no, r.height, r.weight,
        r.education_level,
        JSON.stringify(r.job_history || []),
        JSON.stringify(r.family || []),
        r.interview_result,
        r.reason_for_applying, r.self_pr, r.created_at
      ]
    );
  });

  // Insert Applications - using snake_case from Supabase
  applications.forEach(a => {
    sqlDb.run(
      `INSERT INTO applications (
        id, resumeId, status, type, factoryName, department, hourlyWage, billingUnit,
        startDate, notes, createdAt, processedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id, a.resume_id, a.status, a.type, a.factory_name, a.department,
        safeParseInt(a.hourly_wage), safeParseInt(a.billing_unit),
        a.start_date, a.notes, a.created_at, a.processed_at
      ]
    );
  });

  // Insert Factories - using snake_case from Supabase
  factories.forEach(f => {
    sqlDb.run(
      `INSERT INTO factories (id, name, location, contact) VALUES (?, ?, ?, ?)`,
      [f.id, f.name, f.location, f.contact]
    );
  });

  // Export to binary blob
  const data = sqlDb.export();
  const blob = new Blob([data], { type: "application/x-sqlite3" });
  
  // Download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `StaffHub_Master_Backup_${new Date().toISOString().slice(0, 10)}.db`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
