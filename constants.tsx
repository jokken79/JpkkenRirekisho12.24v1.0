
import React from 'react';
import { TableField } from './types';

export const GENZAIX_FIELDS: TableField[] = [
  { key: 'status', label: '現在', type: 'text', section: 'Status', width: 'w-24', frozen: true },
  { key: 'empId', label: '社員№', type: 'text', section: 'Identification', width: 'w-24', frozen: true },
  { key: 'dispatchId', label: '派遣先ID', type: 'text', section: 'Identification', width: 'w-24' },
  { key: 'dispatchCompany', label: '派遣先', type: 'text', section: 'Identification', width: 'w-48' },
  { key: 'department', label: '配属先', type: 'text', section: 'Assignment', width: 'w-48' },
  { key: 'line', label: '配属ライン', type: 'text', section: 'Assignment', width: 'w-32' },
  { key: 'jobContent', label: '仕事内容', type: 'text', section: 'Assignment', width: 'w-48' },
  { key: 'fullName', label: '氏名', type: 'text', section: 'Profile', width: 'w-48' },
  { key: 'furigana', label: 'カナ', type: 'text', section: 'Profile', width: 'w-48' },
  { key: 'gender', label: '性別', type: 'select', options: ['男', '女'], section: 'Profile', width: 'w-16' },
  { key: 'nationality', label: '国籍', type: 'text', section: 'Profile', width: 'w-32' },
  { key: 'birthDate', label: '生年月日', type: 'date', section: 'Profile', width: 'w-32' },
  { key: 'age', label: '年齢', type: 'number', section: 'Profile', width: 'w-16' },
  { key: 'hourlyWage', label: '時給', type: 'number', section: 'Financial', width: 'w-24' },
  { key: 'wageRevision', label: '時給改定', type: 'text', section: 'Financial', width: 'w-48' },
  { key: 'billingUnit', label: '請求単価', type: 'number', section: 'Financial', width: 'w-24' },
  { key: 'billingRevision', label: '請求改定', type: 'text', section: 'Financial', width: 'w-48' },
  { key: 'profitMargin', label: '差額利益', type: 'number', section: 'Financial', width: 'w-24' },
  { key: 'standardRemuneration', label: '標準報酬', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'healthIns', label: '健康保険', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'nursingIns', label: '介護保険', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'pension', label: '厚生年金', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'visaExpiry', label: 'ビザ期限', type: 'date', section: 'Visa', width: 'w-32' },
  { key: 'visaAlert', label: 'ｱﾗｰﾄ(ﾋﾞｻﾞ更新)', type: 'text', section: 'Visa', width: 'w-32' },
  { key: 'visaType', label: 'ビザ種類', type: 'text', section: 'Visa', width: 'w-48' },
  { key: 'postalCode', label: '〒', type: 'text', section: 'Contact', width: 'w-24' },
  { key: 'address', label: '住所', type: 'text', section: 'Contact', width: 'w-64' },
  { key: 'apartment', label: 'ｱﾊﾟｰﾄ', type: 'text', section: 'Contact', width: 'w-32' },
  { key: 'isShaku', label: '社宅', type: 'boolean', section: 'Contact', width: 'w-16' },
  { key: 'moveInDate', label: '入居', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'hireDate', label: '入社日', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'resignDate', label: '退社日', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'moveOutDate', label: '退去', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'socialInsStatus', label: '社保加入', type: 'text', section: 'Insurance', width: 'w-24' },
  { key: 'hireRequest', label: '入社依頼', type: 'text', section: 'Other', width: 'w-24' },
  { key: 'remarks', label: '備考', type: 'textarea', section: 'Other', width: 'w-64' },
  { key: 'currentHireDate', label: '現入社', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'licenseType', label: '免許種類', type: 'text', section: 'Other', width: 'w-32' },
  { key: 'licenseExpiry', label: '免許期限', type: 'date', section: 'Other', width: 'w-32' },
  { key: 'commuteMethod', label: '通勤方法', type: 'text', section: 'Other', width: 'w-32' },
  { key: 'voluntaryInsExpiry', label: '任意保険期限', type: 'date', section: 'Other', width: 'w-32' },
  { key: 'japaneseLevel', label: '日本語検定', type: 'text', section: 'Skills', width: 'w-32' },
  { key: 'careerUp5', label: 'キャリアアップ5年目', type: 'text', section: 'Other', width: 'w-32' },
];

export const UKEOI_FIELDS: TableField[] = [
  { key: 'status', label: '現在', type: 'text', section: 'Status', width: 'w-24', frozen: true },
  { key: 'empId', label: '社員№', type: 'text', section: 'Identification', width: 'w-24', frozen: true },
  { key: 'contractWork', label: '請負業務', type: 'text', section: 'Assignment', width: 'w-48' },
  { key: 'fullName', label: '氏名', type: 'text', section: 'Profile', width: 'w-48' },
  { key: 'furigana', label: 'カナ', type: 'text', section: 'Profile', width: 'w-48' },
  { key: 'gender', label: '性別', type: 'select', options: ['男', '女'], section: 'Profile', width: 'w-16' },
  { key: 'nationality', label: '国籍', type: 'text', section: 'Profile', width: 'w-32' },
  { key: 'birthDate', label: '生年月日', type: 'date', section: 'Profile', width: 'w-32' },
  { key: 'age', label: '年齢', type: 'number', section: 'Profile', width: 'w-16' },
  { key: 'hourlyWage', label: '時給', type: 'number', section: 'Financial', width: 'w-24' },
  { key: 'wageRevision', label: '時給改定', type: 'text', section: 'Financial', width: 'w-48' },
  { key: 'standardRemuneration', label: '標準報酬', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'healthIns', label: '健康保険', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'nursingIns', label: '介護保険', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'pension', label: '厚生年金', type: 'number', section: 'Insurance', width: 'w-24' },
  { key: 'commuteDist', label: '通勤距離', type: 'number', section: 'Commute', width: 'w-24' },
  { key: 'transportationCost', label: '交通費', type: 'number', section: 'Commute', width: 'w-24' },
  { key: 'profitMargin', label: '差額利益', type: 'number', section: 'Financial', width: 'w-24' },
  { key: 'visaExpiry', label: 'ビザ期限', type: 'date', section: 'Visa', width: 'w-32' },
  { key: 'visaAlert', label: 'ｱﾗｰﾄ(ﾋﾞｻﾞ更新)', type: 'text', section: 'Visa', width: 'w-32' },
  { key: 'visaType', label: 'ビザ種類', type: 'text', section: 'Visa', width: 'w-48' },
  { key: 'postalCode', label: '〒', type: 'text', section: 'Contact', width: 'w-24' },
  { key: 'address', label: '住所', type: 'text', section: 'Contact', width: 'w-64' },
  { key: 'apartment', label: 'ｱﾊﾟｰﾄ', type: 'text', section: 'Contact', width: 'w-32' },
  { key: 'isShaku', label: '社宅', type: 'boolean', section: 'Contact', width: 'w-16' },
  { key: 'moveInDate', label: '入居', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'hireDate', label: '入社日', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'resignDate', label: '退社日', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'moveOutDate', label: '退去', type: 'date', section: 'Dates', width: 'w-32' },
  { key: 'socialInsStatus', label: '社保加入', type: 'text', section: 'Insurance', width: 'w-24' },
  { key: 'bankAccountHolder', label: '口座名義', type: 'text', section: 'Banking', width: 'w-32' },
  { key: 'bankName', label: '銀行名', type: 'text', section: 'Banking', width: 'w-32' },
  { key: 'branchNum', label: '支店番号', type: 'text', section: 'Banking', width: 'w-24' },
  { key: 'branchName', label: '支店名', type: 'text', section: 'Banking', width: 'w-32' },
  { key: 'accountNum', label: '口座番号', type: 'text', section: 'Banking', width: 'w-32' },
  { key: 'hireRequest', label: '入社依頼', type: 'text', section: 'Other', width: 'w-24' },
  { key: 'remarks', label: '備考', type: 'textarea', section: 'Other', width: 'w-64' },
];

export const APP_LOGO = "/logo.png"; // UNS Logo (Local)

export const COMPANY_INFO = {
  name: {
    official: "ユニバーサル企画株式会社",
    english: "Universal Kikaku Co., Ltd.",
    short: "UNS-Kikaku",
    abbr: "UNS"
  },
  address: {
    full: "愛知県名古屋市東区徳川2丁目18番18号",
    postalCode: "461-0025",
    prefecture: "Aichi",
    city: "Nagoya",
    ward: "Higashi Ward",
    line1: "Tokugawa 2-Chome 18-18"
  },
  contact: {
    phone: "052-938-8840",
    fax: "052-938-8841",
    website: "https://www.uns-kikaku.com"
  },
  colors: {
    primary: "#0052CC",
    accent: "#DC143C",
    secondary: "#4FA8D5",
    dark: "#1a3a52"
  }
};

export const PHOTO_BASE_URL = "/photos/"; // Images must be placed in public/photos/
