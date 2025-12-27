
import initSqlJs from "sql.js";
import { db } from "../db";

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

  // Fetch data from Dexie
  const staff = await db.staff.toArray();
  const resumes = await db.resumes.toArray();
  const applications = await db.applications.toArray();
  const factories = await db.factories.toArray();

  // Insert Staff (EXPANDED with all critical fields)
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
        s.id, s.type, s.empId, s.fullName, s.furigana, s.status, s.gender, s.nationality, s.birthDate, safeParseInt(s.age),
        s.department, s.dispatchId, s.dispatchCompany, s.contractWork, safeParseInt(s.hourlyWage), safeParseInt(s.billingUnit),
        safeParseInt(s.profitMargin), safeParseInt(s.standardRemuneration), String(s.healthIns || ''), String(s.nursingIns || ''), String(s.pension || ''), s.socialInsStatus,
        s.visaExpiry, s.visaType, s.postalCode, s.address, s.apartment, s.isShaku ? 1 : 0, s.hireDate, s.resignDate,
        s.bankAccountHolder, s.bankName, s.branchNum, s.branchName, s.accountNum, s.remarks, s.resumeId, s.createdAt
      ]
    );
  });

  // Insert Resumes (with safeParseInt for age)
  resumes.forEach(r => {
    sqlDb.run(
      `INSERT INTO resumes (
        id, applicantId, nameKanji, nameFurigana, birthDate, age, gender, nationality, address,
        postalCode, mobile, visaType, visaPeriod, residenceCardNo, height, weight,
        educationLevel, jobHistory, family, interviewResult, reasonForApplying, selfPR, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.applicantId, r.nameKanji, r.nameFurigana, r.birthDate, safeParseInt(r.age), r.gender, r.nationality, r.address,
        r.postalCode, r.mobile, r.visaType, r.visaPeriod, r.residenceCardNo, r.height, r.weight,
        r.educationLevel,
        JSON.stringify(r.jobHistory || []),
        JSON.stringify(r.family || []),
        r.interviewResult,
        r.reasonForApplying, r.selfPR, r.createdAt
      ]
    );
  });

  // Insert Applications (NEW - was missing!)
  applications.forEach(a => {
    sqlDb.run(
      `INSERT INTO applications (
        id, resumeId, status, type, factoryName, department, hourlyWage, billingUnit,
        startDate, notes, createdAt, processedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id, a.resumeId, a.status, a.type, a.factoryName, a.department,
        safeParseInt(a.hourlyWage), safeParseInt(a.billingUnit),
        a.startDate, a.notes, a.createdAt, a.processedAt
      ]
    );
  });

  // Insert Factories (NEW - was missing!)
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
