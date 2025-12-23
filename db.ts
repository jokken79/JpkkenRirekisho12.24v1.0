
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { StaffMember, Rirekisho, UserProfile } from './types';

// Use the default export of Dexie to ensure proper inheritance of instance methods like version()
export class StaffHubDB extends Dexie {
  staff!: Table<StaffMember>;
  resumes!: Table<Rirekisho>;
  settings!: Table<UserProfile>;

  constructor() {
    super('StaffHubDB');
    // Defining schema version 6
    this.version(6).stores({
      staff: '++id, type, empId, fullName, status, department, companyName, hireDate, dispatchCompany, contractWork, resumeId, isShaku',
      resumes: '++id, applicantId, nameKanji, interviewResult, createdAt',
      applications: '++id, resumeId, status, type, factoryName, startDate',
      factories: '++id, name, location',
      settings: 'key'
    });
  }
}

export const db = new StaffHubDB();
