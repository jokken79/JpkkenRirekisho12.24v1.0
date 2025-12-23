
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'D:\\【新】社員台帳(UNS)T\u30002022.04.05～.xlsm';

try {
  const workbook = XLSX.readFile(filePath);
  
  const genzaiSheetName = workbook.SheetNames.find(n => n.includes('GenzaiX'));
  const ukeoiSheetName = workbook.SheetNames.find(n => n.includes('UkeoiX'));

  const result = {
    genzai: [],
    ukeoi: []
  };

  if (genzaiSheetName) {
    const ws = workbook.Sheets[genzaiSheetName];
    // Get the range
    const range = XLSX.utils.decode_range(ws['!ref']);
    // Assuming headers are in the 3rd row (index 2) based on typical Japanese Excel forms, 
    // but I'll check the first few rows to be sure. 
    // Actually, let's grab the first non-empty row as headers.
    // Let's grab row 0, 1, 2. Usually row 2 or 3 is the header in these systems.
    // Let's dump the first 5 rows as arrays of arrays to inspect.
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' }).slice(0, 5);
    result.genzai = data;
  }

  if (ukeoiSheetName) {
    const ws = workbook.Sheets[ukeoiSheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' }).slice(0, 5);
    result.ukeoi = data;
  }

  console.log(JSON.stringify(result, null, 2));

} catch (error) {
  console.error("Error reading file:", error);
}
