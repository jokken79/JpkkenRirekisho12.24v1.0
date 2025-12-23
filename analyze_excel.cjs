
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'D:\\【新】社員台帳(UNS)T\u30002022.04.05～.xlsm';

try {
  console.log("Attempting to read file...");
  const workbook = XLSX.readFile(filePath);
  
  const genzaiSheetName = workbook.SheetNames.find(n => n.includes('GenzaiX'));
  const ukeoiSheetName = workbook.SheetNames.find(n => n.includes('UkeoiX'));

  const result = {
    genzaiHeaders: [],
    ukeoiHeaders: [],
    genzaiSample: [],
    ukeoiSample: []
  };

  if (genzaiSheetName) {
    console.log(`Found GenzaiX sheet: ${genzaiSheetName}`);
    const ws = workbook.Sheets[genzaiSheetName];
    // Get rows as arrays to visually inspect where the headers are
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
    // Usually headers are in row index 1 (line 2) or 2 (line 3) in Japanese Excels.
    // I'll grab the first 5 rows to return them to the AI to analyze.
    result.genzaiSample = rows.slice(0, 5);
  } else {
    console.log("GenzaiX sheet NOT found");
  }

  if (ukeoiSheetName) {
    console.log(`Found UkeoiX sheet: ${ukeoiSheetName}`);
    const ws = workbook.Sheets[ukeoiSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
    result.ukeoiSample = rows.slice(0, 5);
  } else {
    console.log("UkeoiX sheet NOT found");
  }

  fs.writeFileSync('headers.json', JSON.stringify(result, null, 2));
  console.log("Results written to headers.json");

} catch (error) {
  console.error("Error details:", error);
}
