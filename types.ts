
export type StaffType = 'GenzaiX' | 'Ukeoi';

// Family member structure for Rirekisho
export interface FamilyMember {
  name?: string;
  relation?: string;
  age?: number;
  occupation?: string;
  livingTogether?: boolean;
}

// Job history entry for Rirekisho
export interface JobHistoryEntry {
  companyName?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

// User profile for settings
export interface UserProfile {
  key: string;
  displayName?: string;
  email?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  createdAt?: number;
}

export interface StaffMember {
  id?: number;
  type: StaffType;
  
  // Identification
  status: string; // 現在
  empId: string; // 社員№
  fullName: string; // 氏名
  furigana?: string; // カナ
  gender?: string; // 性別
  nationality?: string; // 国籍
  birthDate?: string; // 生年月日 (stored as string or Excel serial date)
  age?: number; // 年齢
  
  // Work & Contract (GenzaiX specific mostly)
  dispatchId?: string; // 派遣先ID
  dispatchCompany?: string; // 派遣先
  department?: string; // 配属先 (common)
  line?: string; // 配属ライン
  jobContent?: string; // 仕事内容
  contractWork?: string; // 請負業務 (Ukeoi specific)
  
  // Financial
  hourlyWage?: number; // 時給
  wageRevision?: string; // 時給改定
  billingUnit?: number; // 請求単価
  billingRevision?: string; // 請求改定
  profitMargin?: number; // 差額利益
  standardRemuneration?: number; // 標準報酬
  
  // Insurance
  healthIns?: number | string; // 健康保険
  nursingIns?: number | string; // 介護保険
  pension?: number | string; // 厚生年金
  socialInsStatus?: string; // 社保加入
  
  // Visa
  visaExpiry?: string; // ビザ期限
  visaAlert?: string; // ｱﾗｰﾄ(ﾋﾞｻﾞ更新)
  visaType?: string; // ビザ種類
  
  // Location
  postalCode?: string; // 〒
  address?: string; // 住所
  apartment?: string; // ｱﾊﾟｰﾄ
  
  // Dates
  hireDate?: string; // 入社日
  resignDate?: string; // 退社日
  moveInDate?: string; // 入居
  moveOutDate?: string; // 退去
  currentHireDate?: string; // 現入社
  hireRequest?: string; // 入社依頼
  
  // Relations & Media
  avatar?: string; // Photo URL/Base64
  resumeId?: number; // Link to Rirekisho table
  isShaku?: boolean; // 社宅 (Company Housing) - true if company housing
  
  // Banking (Ukeoi specific)
  bankAccountHolder?: string; // 口座名義
  bankName?: string; // 銀行名
  branchNum?: string; // 支店番号
  branchName?: string; // 支店名
  accountNum?: string; // 口座番号
  
  // Commute & Other
  commuteMethod?: string; // 通勤方法
  commuteDist?: number; // 通勤距離
  transportationCost?: number; // 交通費
  licenseType?: string; // 免許種類
  licenseExpiry?: string; // 免許期限
  voluntaryInsExpiry?: string; // 任意保険期限
  japaneseLevel?: string; // 日本語検定
  careerUp5?: string; // キャリアアップ5年目
  
  // Metadata
  remarks?: string; // 備考
  companyName?: string; // Kept for backward compatibility/generic use
  position?: string; // Kept for backward compatibility
  createdAt?: number;
}

export interface Rirekisho {
  id?: number;
  applicantId: string;
  nameKanji: string;
  nameFurigana?: string;
  nameRomanji?: string; // New
  birthDate?: string;
  age?: number;
  gender?: string;
  nationality?: string;
  maritalStatus?: string; // New
  japanEntryDate?: string; // New
  stayDuration?: string; // New
  generation?: string; // New
  
  address?: string;
  postalCode?: string;
  mobile?: string;
  phone?: string;
  
  // Emergency Contact (New)
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };

  visaType?: string;
  visaPeriod?: string;
  residenceCardNo?: string;
  passportNo?: string; // New
  passportExpiry?: string; // New
  
  // Physical & Health (Expanded)
  height?: string;
  weight?: string;
  shoeSize?: string;
  waist?: string;
  uniformSize?: string;
  bloodType?: string;
  visionRight?: string;
  visionLeft?: string;
  wearsGlasses?: string;
  dominantArm?: string;
  safetyShoes?: string;
  vaccineStatus?: string;
  
  // Education & Language (Expanded)
  educationLevel?: string;
  educationStatus?: string;
  languageSkills?: {
    conversation: string;
    listening: string;
    kanji: string;
    kanaRead: string;
    kanaWrite: string;
  };
  
  family?: FamilyMember[];
  jobHistory?: JobHistoryEntry[]; 
  
  // Evaluation (New)
  interviewResult?: 'passed' | 'failed' | 'pending';
  evaluationNotes?: string;
  
  reasonForApplying?: string;
  selfPR?: string;
  
  legacyRaw?: any; 
  createdAt: number;
}

export interface Application {
  id?: number;
  resumeId: number;
  status: 'draft' | 'pending' | 'approved' | 'completed';
  type: StaffType; // GenzaiX or Ukeoi
  
  // Hiring Details (Nyusha Todoke)
  factoryName: string;
  department?: string;
  hourlyWage?: number;
  billingUnit?: number;
  startDate: string;
  
  // Metadata
  notes?: string;
  createdAt: number;
  processedAt?: number;
}

export interface Factory {
  id?: number;
  name: string;
  location?: string;
  contact?: string;
}

export interface TableField {
  key: keyof StaffMember;
  label: string;
  type: 'text' | 'date' | 'select' | 'tel' | 'email' | 'number' | 'textarea' | 'computed';
  section: string;
  width?: string;
  frozen?: boolean;
  options?: string[];
}
