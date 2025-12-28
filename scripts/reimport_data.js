/**
 * Re-import Script for StaffHub UNS Pro
 * Only uses columns that exist in Supabase schema
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase config
const SUPABASE_URL = 'https://besembwtnuarriscreve.supabase.co';
// Service role key bypasses RLS - provided via command line argument
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Service role key is required!');
  console.error('   Usage: node scripts/reimport_data.js <service_role_key>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Excel file path
const EXCEL_FILE = path.join(__dirname, '..', '【新】社員台帳(UNS)T　2022.04.05～.xlsm');

// Helper: Convert Excel serial date to YYYY-MM-DD
function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(serial)) return serial.substring(0, 10);
    const match = serial.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    return null;
  }
  if (typeof serial !== 'number' || isNaN(serial) || serial < 1) return null;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Helper: Parse integer safely
function parseIntSafe(val) {
  if (val === null || val === undefined || val === '' || val === 0) return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num);
}

// Helper: Clean string
function cleanStr(val) {
  if (val === null || val === undefined || val === 0) return null;
  const str = String(val).trim();
  return str === '' || str === '0' ? null : str;
}

// Map status values
function mapStatus(val) {
  const s = String(val || '').trim();
  if (s.includes('在職') || s === '在職中') return '在職中';
  if (s.includes('退社') || s === '退社') return '退社';
  if (s.includes('休職')) return '休職中';
  return s || '在職中';
}

async function deleteAllStaff() {
  console.log('🗑️  Deleting all staff data...');

  const { data: staff, error: fetchError } = await supabase
    .from('staff')
    .select('id');

  if (fetchError) {
    console.error('Error fetching staff:', fetchError);
    return false;
  }

  if (!staff || staff.length === 0) {
    console.log('   No staff to delete');
    return true;
  }

  console.log(`   Found ${staff.length} staff records to delete`);

  const batchSize = 100;
  for (let i = 0; i < staff.length; i += batchSize) {
    const batch = staff.slice(i, i + batchSize);
    const ids = batch.map(s => s.id);

    const { error } = await supabase
      .from('staff')
      .delete()
      .in('id', ids);

    if (error) {
      console.error(`Error deleting batch ${i}:`, error);
      return false;
    }
    console.log(`   Deleted ${Math.min(i + batchSize, staff.length)}/${staff.length}`);
  }

  console.log('✅ All staff deleted');
  return true;
}

async function importGenzaiX(workbook) {
  console.log('\n📥 Importing DBGenzaiX (派遣社員)...');

  const sheet = workbook.Sheets['DBGenzaiX'];
  if (!sheet) {
    console.error('   Sheet DBGenzaiX not found!');
    return 0;
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`   Found ${rows.length - 1} rows`);

  let imported = 0;
  let skipped = 0;

  // DBGenzaiX columns mapping (only columns that exist in Supabase):
  // 0: 現在 (status), 1: 社員№ (emp_id)
  // 7: 氏名 (full_name), 8: カナ (full_name_kana)
  // 9: 性別 (gender), 10: 国籍 (nationality)
  // 11: 生年月日 (birth_date), 12: 年齢 (age)
  // 13: 時給 (hourly_wage), 15: 請求単価 (billing_unit)
  // 17: 差額利益 (profit_margin), 18: 標準報酬 (standard_remuneration)
  // 19: 健康保険 (health_ins), 20: 介護保険 (nursing_ins), 21: 厚生年金 (pension)
  // 22: ビザ期限 (visa_expiry), 24: ビザ種類 (visa_type)
  // 25: 〒 (postal_code), 26+27: 住所+ｱﾊﾟｰﾄ (address)
  // 28: 入居 indicates is_shaku, 29: 入社日 (hire_date)
  // 35: 備考 (notes)

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const empId = String(row[1] || '').trim();

    if (!empId || empId === '' || empId === '0') {
      skipped++;
      continue;
    }

    // Combine address and apartment
    const address = cleanStr(row[26]);
    const apartment = cleanStr(row[27]);
    const fullAddress = [address, apartment].filter(Boolean).join(' ');

    // Build notes with extra info
    const noteParts = [];
    if (cleanStr(row[3])) noteParts.push(`派遣先: ${row[3]}`);
    if (cleanStr(row[4])) noteParts.push(`配属先: ${row[4]}`);
    if (cleanStr(row[5])) noteParts.push(`ライン: ${row[5]}`);
    if (cleanStr(row[6])) noteParts.push(`仕事内容: ${row[6]}`);
    if (cleanStr(row[35])) noteParts.push(row[35]);
    const notes = noteParts.length > 0 ? noteParts.join('\n') : null;

    const staffData = {
      type: 'GenzaiX',
      status: mapStatus(row[0]),
      emp_id: empId,
      full_name: cleanStr(row[7]) || 'Unknown',
      full_name_kana: cleanStr(row[8]),
      gender: cleanStr(row[9]),
      nationality: cleanStr(row[10]),
      birth_date: excelDateToISO(row[11]),
      age: parseIntSafe(row[12]),
      hourly_wage: parseIntSafe(row[13]),
      billing_unit: parseIntSafe(row[15]),
      profit_margin: parseIntSafe(row[17]),
      standard_remuneration: parseIntSafe(row[18]),
      health_ins: parseIntSafe(row[19]),
      nursing_ins: parseIntSafe(row[20]),
      pension: parseIntSafe(row[21]),
      visa_expiry: excelDateToISO(row[22]),
      visa_type: cleanStr(row[24]),
      postal_code: cleanStr(row[25]),
      address: fullAddress || null,
      is_shaku: row[28] ? true : false,
      hire_date: excelDateToISO(row[29]),
      notes: notes,
      photo: `${empId}.jpg`
    };

    try {
      const { error } = await supabase.from('staff').insert(staffData);
      if (error) {
        console.error(`   Error row ${i} (${empId}):`, error.message);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`   Exception row ${i}:`, err.message);
      skipped++;
    }

    if (i % 100 === 0) {
      console.log(`   Progress: ${i}/${rows.length - 1} (imported: ${imported}, skipped: ${skipped})`);
    }
  }

  console.log(`✅ GenzaiX: Imported ${imported}, Skipped ${skipped}`);
  return imported;
}

async function importUkeoiX(workbook) {
  console.log('\n📥 Importing DBUkeoiX (請負社員)...');

  const sheet = workbook.Sheets['DBUkeoiX'];
  if (!sheet) {
    console.error('   Sheet DBUkeoiX not found!');
    return 0;
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`   Found ${rows.length - 1} rows`);

  let imported = 0;
  let skipped = 0;

  // DBUkeoiX columns:
  // 0: 現在, 1: 社員№, 2: 請負業務
  // 3: 氏名, 4: カナ, 5: 性別, 6: 国籍
  // 7: 生年月日, 8: 年齢, 9: 時給
  // 11: 標準報酬, 12: 健康保険, 13: 介護保険, 14: 厚生年金
  // 17: 差額利益, 18: ビザ期限, 20: ビザ種類
  // 21: 〒, 22: 住所, 23: ｱﾊﾟｰﾄ
  // 24: 入居, 25: 入社日
  // 29: 口座名義, 30: 銀行名, 32: 支店名, 33: 口座番号
  // 35: 備考

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const empId = String(row[1] || '').trim();

    if (!empId || empId === '' || empId === '0') {
      skipped++;
      continue;
    }

    // Combine address and apartment
    const address = cleanStr(row[22]);
    const apartment = cleanStr(row[23]);
    const fullAddress = [address, apartment].filter(Boolean).join(' ');

    // Build notes
    const noteParts = [];
    if (cleanStr(row[2])) noteParts.push(`請負業務: ${row[2]}`);
    if (cleanStr(row[35])) noteParts.push(row[35]);
    const notes = noteParts.length > 0 ? noteParts.join('\n') : null;

    const staffData = {
      type: 'Ukeoi',
      status: mapStatus(row[0]),
      emp_id: empId,
      full_name: cleanStr(row[3]) || 'Unknown',
      full_name_kana: cleanStr(row[4]),
      gender: cleanStr(row[5]),
      nationality: cleanStr(row[6]),
      birth_date: excelDateToISO(row[7]),
      age: parseIntSafe(row[8]),
      hourly_wage: parseIntSafe(row[9]),
      standard_remuneration: parseIntSafe(row[11]),
      health_ins: parseIntSafe(row[12]),
      nursing_ins: parseIntSafe(row[13]),
      pension: parseIntSafe(row[14]),
      profit_margin: parseIntSafe(row[17]),
      visa_expiry: excelDateToISO(row[18]),
      visa_type: cleanStr(row[20]),
      postal_code: cleanStr(row[21]),
      address: fullAddress || null,
      is_shaku: row[24] ? true : false,
      hire_date: excelDateToISO(row[25]),
      bank_account_holder: cleanStr(row[29]),
      bank_name: cleanStr(row[30]),
      bank_branch: cleanStr(row[32]),
      bank_account_number: cleanStr(row[33]),
      notes: notes,
      photo: `${empId}.jpg`
    };

    try {
      const { error } = await supabase.from('staff').insert(staffData);
      if (error) {
        console.error(`   Error row ${i} (${empId}):`, error.message);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`   Exception row ${i}:`, err.message);
      skipped++;
    }
  }

  console.log(`✅ Ukeoi: Imported ${imported}, Skipped ${skipped}`);
  return imported;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  StaffHub UNS Pro - Data Re-Import Script');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Delete all staff
  const deleted = await deleteAllStaff();
  if (!deleted) {
    console.error('❌ Failed to delete staff. Aborting.');
    process.exit(1);
  }

  // Step 2: Read Excel file
  console.log('\n📖 Reading Excel file...');
  console.log(`   ${EXCEL_FILE}`);

  let workbook;
  try {
    workbook = XLSX.readFile(EXCEL_FILE);
    console.log('   Sheets:', workbook.SheetNames.join(', '));
  } catch (err) {
    console.error('❌ Failed to read Excel:', err.message);
    process.exit(1);
  }

  // Step 3: Import GenzaiX
  const genzaiCount = await importGenzaiX(workbook);

  // Step 4: Import Ukeoi
  const ukeoiCount = await importUkeoiX(workbook);

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`  GenzaiX: ${genzaiCount} records`);
  console.log(`  Ukeoi:   ${ukeoiCount} records`);
  console.log(`  Total:   ${genzaiCount + ukeoiCount} records`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
