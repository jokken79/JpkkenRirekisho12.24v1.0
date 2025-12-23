
import initSqlJs from "sql.js";
import { db } from "../db";

export const exportToSQLite = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `https://esm.sh/sql.js@1.12.0/dist/${file}`
  });

  const sqlDb = new SQL.Database();

  // Create Staff Table
  sqlDb.run(`
    CREATE TABLE staff (
      id INTEGER PRIMARY KEY,
      type TEXT,
      empId TEXT,
      fullName TEXT,
      status TEXT,
      department TEXT,
      position TEXT,
      hireDate TEXT,
      companyName TEXT,
      remarks TEXT,
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
      address TEXT,
      postalCode TEXT,
      mobile TEXT,
      visaType TEXT,
      visaPeriod TEXT,
      residenceCardNo TEXT,
      height TEXT,
      weight TEXT,
      educationHistory TEXT, -- JSON String
      jobHistory TEXT, -- JSON String
      family TEXT, -- JSON String
      experience TEXT, -- JSON String
      reasonForApplying TEXT,
      selfPR TEXT,
      createdAt INTEGER
    )
  `);

  // Fetch data from Dexie
  const staff = await db.staff.toArray();
  const resumes = await db.resumes.toArray();

  // Insert Staff
  staff.forEach(s => {
    sqlDb.run(
      "INSERT INTO staff (id, type, empId, fullName, status, department, position, hireDate, companyName, remarks, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [s.id, s.type, s.empId, s.fullName, s.status, s.department, s.position, s.hireDate, s.companyName, s.remarks, s.createdAt]
    );
  });

  // Insert Resumes
  resumes.forEach(r => {
    sqlDb.run(
      `INSERT INTO resumes (
        id, applicantId, nameKanji, nameFurigana, birthDate, age, gender, address, 
        postalCode, mobile, visaType, visaPeriod, residenceCardNo, height, weight, 
        educationHistory, jobHistory, family, experience, reasonForApplying, selfPR, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.applicantId, r.nameKanji, r.nameFurigana, r.birthDate, parseInt(r.age), r.gender, r.address,
        r.postalCode, r.mobile, r.visaType, r.visaPeriod, r.residenceCardNo, r.height, r.weight,
        JSON.stringify(r.educationHistory || []),
        JSON.stringify(r.jobHistory || []),
        JSON.stringify(r.family || []),
        JSON.stringify(r.experience || []),
        r.reasonForApplying, r.selfPR, r.createdAt
      ]
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
