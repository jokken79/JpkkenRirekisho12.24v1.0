/**
 * Import Resumes from legacy_resumes.json to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase config
const SUPABASE_URL = 'https://besembwtnuarriscreve.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Service role key is required!');
  console.error('   Usage: node scripts/import_resumes.js <service_role_key>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// JSON file path
const JSON_FILE = path.join(__dirname, '..', 'legacy_resumes.json');

// Helper: Parse date safely
function parseDateSafe(val) {
  if (!val) return null;
  const str = String(val);
  if (str === 'NaT' || str === 'Na' || str === 'null' || str === 'undefined' || str === '') {
    return null;
  }
  // ISO format
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  // YYYY/MM/DD format
  const slashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }
  return null;
}

// Helper: Clean string
function cleanStr(val) {
  if (val === null || val === undefined || val === 0) return null;
  const str = String(val).trim();
  return str === '' || str === '0' ? null : str;
}

// Helper: Calculate age from birth date
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 && age < 120 ? age : null;
}

async function deleteAllResumes() {
  console.log('🗑️  Deleting all resume data...');

  const { data: resumes, error: fetchError } = await supabase
    .from('resumes')
    .select('id');

  if (fetchError) {
    console.error('Error fetching resumes:', fetchError);
    return false;
  }

  if (!resumes || resumes.length === 0) {
    console.log('   No resumes to delete');
    return true;
  }

  console.log(`   Found ${resumes.length} resume records to delete`);

  const batchSize = 100;
  for (let i = 0; i < resumes.length; i += batchSize) {
    const batch = resumes.slice(i, i + batchSize);
    const ids = batch.map(r => r.id);

    const { error } = await supabase
      .from('resumes')
      .delete()
      .in('id', ids);

    if (error) {
      console.error(`Error deleting batch ${i}:`, error);
      return false;
    }
    console.log(`   Deleted ${Math.min(i + batchSize, resumes.length)}/${resumes.length}`);
  }

  console.log('✅ All resumes deleted');
  return true;
}

async function importResumes() {
  console.log('\n📥 Importing resumes from JSON...');

  const jsonContent = fs.readFileSync(JSON_FILE, 'utf-8');
  const records = JSON.parse(jsonContent);

  console.log(`   Found ${records.length} records`);

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // Build education from 最終学歴
    const education = rec['最終学歴'] ? [{ school: rec['最終学歴'], graduated: true }] : null;

    // Build job history from 職歴 fields
    const jobHistory = [];
    for (let j = 1; j <= 7; j++) {
      const company = rec[`職歴入社会社名${j}`];
      if (company) {
        jobHistory.push({
          company,
          startYear: rec[`職歴年入社${j}`] || '',
          startMonth: rec[`職歴月入社${j}`] || '',
          endYear: rec[`職歴年退社社${j}`] || '',
          endMonth: rec[`職歴月退社社${j}`] || ''
        });
      }
    }

    // Build family from 家族構成 fields
    const family = [];
    for (let j = 1; j <= 5; j++) {
      const name = rec[`家族構成氏名${j}`];
      if (name) {
        family.push({
          name,
          relationship: rec[`家族構成続柄${j}`] || '',
          age: rec[`年齢${j}`] || '',
          residence: rec[`居住${j}`] || ''
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

    // Build address
    const addressParts = [rec['現住所'], rec['番地'], rec['物件名']].filter(Boolean);
    const fullAddress = addressParts.join(' ').trim() || null;

    const birthDate = parseDateSafe(rec['生年月日']);

    const resumeData = {
      applicant_id: String(rec['履歴書ID'] || ''),
      full_name: cleanStr(rec['氏名']) || 'Unknown',
      full_name_kana: cleanStr(rec['フリガナ']),
      birth_date: birthDate,
      age: calculateAge(birthDate),
      gender: cleanStr(rec['性別']),
      nationality: cleanStr(rec['国籍']),
      postal_code: cleanStr(rec['郵便番号']),
      address: fullAddress,
      phone: cleanStr(rec['携帯電話']) || cleanStr(rec['電話番号']),
      email: cleanStr(rec['email']),
      photo: cleanStr(rec['写真']),
      education: education,
      job_history: jobHistory.length > 0 ? jobHistory : null,
      licenses: licenses.length > 0 ? licenses : null,
      family: family.length > 0 ? family : null,
      skills: cleanStr(rec['特技']),
      hobbies: cleanStr(rec['趣味']),
      motivation: cleanStr(rec['志望動機']),
      requests: cleanStr(rec['本人希望']),
      spouse: rec['配偶者'] === '有',
    };

    try {
      const { error } = await supabase.from('resumes').insert(resumeData);
      if (error) {
        console.error(`   Error row ${i} (ID: ${rec['履歴書ID']}):`, error.message);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`   Exception row ${i}:`, err.message);
      skipped++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`   Progress: ${i + 1}/${records.length} (imported: ${imported}, skipped: ${skipped})`);
    }
  }

  console.log(`✅ Resumes: Imported ${imported}, Skipped ${skipped}`);
  return imported;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  StaffHub UNS Pro - Resume Import Script');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Delete all resumes
  const deleted = await deleteAllResumes();
  if (!deleted) {
    console.error('❌ Failed to delete resumes. Aborting.');
    process.exit(1);
  }

  // Step 2: Import resumes
  const count = await importResumes();

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`  Resumes: ${count} records`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
