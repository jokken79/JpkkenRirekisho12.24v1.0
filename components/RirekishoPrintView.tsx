
import React from 'react';
import { Rirekisho } from '../types';
import { PHOTO_BASE_URL } from '../constants';

interface RirekishoPrintViewProps {
  resume: Rirekisho;
  onClose?: () => void;
}

const formatDateToJapanese = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback if not a date
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
  } catch (e) {
    return "";
  }
};

const RirekishoPrintView: React.FC<RirekishoPrintViewProps> = ({ resume, onClose }) => {
  // Map legacy/new data to the format expected by the print view
  const data = {
    ...resume,
    // Safely access properties or defaults
    receptionDate: resume.createdAt ? new Date(resume.createdAt).toISOString().split('T')[0] : '',
    timeInJapan: resume.legacyRaw?.['来日'] || '',
    birthday: resume.birthDate,
    age: resume.age || (resume.birthDate ? new Date().getFullYear() - new Date(resume.birthDate).getFullYear() : ''),
    gender: resume.gender,
    nationality: resume.nationality,
    postalCode: resume.postalCode,
    mobile: resume.mobile,
    phone: resume.phone,
    address: resume.address,
    emergencyName: resume.legacyRaw?.['緊急連絡先氏名'] || '', // Try to find in legacy
    emergencyRelation: resume.legacyRaw?.['緊急連絡先続柄'] || '',
    emergencyPhone: resume.legacyRaw?.['緊急連絡先電話'] || '',
    visaType: resume.visaType,
    visaPeriod: resume.visaPeriod || resume.legacyRaw?.['在留期間'] || '',
    residenceCardNo: resume.residenceCardNo,
    passportNo: resume.legacyRaw?.['パスポート番号'] || '',
    passportExpiry: resume.legacyRaw?.['パスポート期限'] || '',
    licenseNo: resume.legacyRaw?.['運転免許番号'] || '',
    licenseExpiry: resume.legacyRaw?.['運転免許期限'] || '',
    carOwner: resume.legacyRaw?.['自動車所有'] || '',
    insurance: resume.legacyRaw?.['任意保険加入'] || '',
    
    // Skills & Language
    speakLevel: resume.legacyRaw?.['会話ができる'] || '',
    listenLevel: resume.legacyRaw?.['会話が理解できる'] || '',
    kanjiReadLevel: resume.legacyRaw?.['漢字の読み書き'] || '',
    kanjiWriteLevel: resume.legacyRaw?.['漢字の読み書き'] || '', // Simplify mapping
    hiraganaReadLevel: resume.legacyRaw?.['ひらがな・カタカナ読める'] || '',
    hiraganaWriteLevel: resume.legacyRaw?.['ひらがな・カタカナ書ける'] || '',
    katakanaReadLevel: resume.legacyRaw?.['ひらがな・カタカナ読める'] || '',
    katakanaWriteLevel: resume.legacyRaw?.['ひらがな・カタカナ書ける'] || '',
    
    education: resume.educationHistory?.[resume.educationHistory.length - 1]?.schoolName || resume.legacyRaw?.['最終学歴'] || '',
    major: resume.legacyRaw?.['専攻'] || '',
    
    // Physical
    height: resume.height,
    weight: resume.weight,
    bloodType: resume.legacyRaw?.['血液型'] || '',
    waist: resume.legacyRaw?.['ウエスト'] || '',
    shoeSize: resume.shoeSize,
    uniformSize: resume.legacyRaw?.['服のサイズ'] || '',
    visionRight: resume.legacyRaw?.['視力 右'] || '',
    visionLeft: resume.legacyRaw?.['視力 左'] || '',
    glasses: resume.legacyRaw?.['眼鏡 コンタクト使用'] || '',
    dominantArm: resume.legacyRaw?.['利き腕 右'] ? '右' : resume.legacyRaw?.['利き腕 左'] ? '左' : '',
    allergy: resume.legacyRaw?.['アレルギー 有'] ? '有' : '無',
    safetyShoes: resume.legacyRaw?.['安全靴持参'] || '',
    vaccine: resume.legacyRaw?.['コロナワクチン予定接種状況'] || '',
    
    // Commute
    commuteMethod: resume.commuteMethod || resume.legacyRaw?.['通勤方法'] || '',
    commuteTimeMin: resume.legacyRaw?.['通勤時間'] || '',
    lunchPref: resume.legacyRaw?.['お弁当'] || '',
    
    // Lists (legacy structure mapping needs care, doing simple check)
    jobs: resume.jobHistory || [],
    family: resume.family || [],
    
    // Qualifications check
    forkliftLicense: resume.legacyRaw?.['免許種類']?.includes('フォークリフト') || false,
    jlpt: !!resume.japaneseLevel,
    jlptLevel: resume.japaneseLevel,
    otherQualifications: resume.legacyRaw?.['有資格取得'] || resume.legacyRaw?.['有資格取得1'] || '',
  };

  // Resolve Photo URL
  const photoFilename = resume.legacyRaw?.['写真'];
  const photoUrl = photoFilename ? `${PHOTO_BASE_URL}${photoFilename}` : undefined;

  return (
    <div className="print-wrapper bg-slate-100 min-h-screen p-8 flex justify-center print:p-0 print:bg-white">
      {/* Floating Action Buttons for Screen only */}
      <div className="fixed bottom-8 right-8 flex gap-4 print:hidden z-50">
        <button 
          onClick={onClose}
          className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-full shadow-lg font-bold transition-all"
        >
          Close
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 transition-all"
        >
          🖨️ Print Resume
        </button>
      </div>

      <div className="rirekisho-print-container shadow-2xl print:shadow-none">
        {/* Header */}
        <div className="print-header">
          <h1>履歴書</h1>
        </div>

        {/* Basic Info - Photo and Personal Details */}
        <div className="form-section basic-info-layout">
          <div className="photo-container">
            <div className="photo-frame">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="証明写真"
                  className="photo-img"
                />
              ) : (
                <span className="photo-placeholder">写真</span>
              )}
            </div>
          </div>
          <div className="info-column">
            <table className="info-table personal-info-table">
              <tbody>
                <tr className="tall-row">
                  <th>受付日</th>
                  <td colSpan={3}>{formatDateToJapanese(data.receptionDate)}</td>
                  <th>来日</th>
                  <td colSpan={3}>{data.timeInJapan}</td>
                </tr>
                <tr className="tall-row">
                  <th>氏名</th>
                  <td colSpan={3}>{data.nameKanji}</td>
                  <th>フリガナ</th>
                  <td colSpan={3}>{data.nameFurigana}</td>
                </tr>
                <tr className="tall-row">
                  <th>生年月日</th>
                  <td>{formatDateToJapanese(data.birthday)}</td>
                  <th>年齢</th>
                  <td>{data.age}</td>
                  <th>性別</th>
                  <td>{data.gender}</td>
                  <th>国籍</th>
                  <td>{data.nationality}</td>
                </tr>
                <tr className="tall-row">
                  <th>郵便番号</th>
                  <td>{data.postalCode}</td>
                  <th>携帯電話</th>
                  <td>{data.mobile}</td>
                  <th>電話番号</th>
                  <td colSpan={3}>{data.phone}</td>
                </tr>
                <tr className="tall-row">
                  <th>住所</th>
                  <td colSpan={7}>{data.address}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="form-section emergency-contact-section">
          <h2>緊急連絡先</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>氏名</th>
                <td>{data.emergencyName}</td>
                <th>続柄</th>
                <td>{data.emergencyRelation}</td>
                <th>電話番号</th>
                <td>{data.emergencyPhone}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <div className="form-section documents-section">
          <h2>書類関係</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>在留種類</th>
                <td>{data.visaType}</td>
                <th>在留期間</th>
                <td>{data.visaPeriod}</td>
                <th>在留カード番号</th>
                <td>{data.residenceCardNo}</td>
              </tr>
              <tr>
                <th>パスポート番号</th>
                <td>{data.passportNo}</td>
                <th>パスポート期限</th>
                <td>{formatDateToJapanese(data.passportExpiry)}</td>
                <th>運転免許番号</th>
                <td>{data.licenseNo}</td>
              </tr>
              <tr>
                <th>運転免許期限</th>
                <td>{formatDateToJapanese(data.licenseExpiry)}</td>
                <th>自動車所有</th>
                <td>{data.carOwner}</td>
                <th>任意保険加入</th>
                <td>{data.insurance}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Language & Education */}
        <div className="form-section">
          <h2>日本語能力・学歴</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>話す</th>
                <td>{data.speakLevel}</td>
                <th>聞く</th>
                <td>{data.listenLevel}</td>
              </tr>
              <tr>
                <th>読み書き</th>
                <td colSpan={3}>
                  <div className="grid-2-cols">
                    <div>漢字(読み): {data.kanjiReadLevel}</div>
                    <div>漢字(書き): {data.kanjiWriteLevel}</div>
                    <div>ひらがな(読み): {data.hiraganaReadLevel}</div>
                    <div>ひらがな(書き): {data.hiraganaWriteLevel}</div>
                    <div>カタカナ(読み): {data.katakanaReadLevel}</div>
                    <div>カタカナ(書き): {data.katakanaWriteLevel}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>最終学歴</th>
                <td>{data.education}</td>
                <th>専攻</th>
                <td>{data.major}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Qualifications */}
        <div className="form-section">
          <h2>有資格取得</h2>
          <div className="qualifications-container">
            <div className="qualification-row">
              <span className="qualification-label">
                {data.forkliftLicense ? "✓" : "□"} フォークリフト資格
              </span>
              <span className="qualification-label">
                {data.jlpt ? "✓" : "□"} 日本語検定
              </span>
              {data.jlpt && <span className="qualification-level">({data.jlptLevel})</span>}
              {data.otherQualifications && <span className="qualification-label">その他: {data.otherQualifications}</span>}
            </div>
          </div>
        </div>

        {/* Physical Info */}
        <div className="form-section">
          <h2>身体情報・健康状態</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>身長(cm)</th>
                <td>{data.height}</td>
                <th>体重(kg)</th>
                <td>{data.weight}</td>
                <th>血液型</th>
                <td>{data.bloodType}</td>
                <th>ウエスト(cm)</th>
                <td>{data.waist}</td>
              </tr>
              <tr>
                <th>靴サイズ(cm)</th>
                <td>{data.shoeSize}</td>
                <th>服のサイズ</th>
                <td>{data.uniformSize}</td>
                <th>視力(右)</th>
                <td>{data.visionRight}</td>
                <th>視力(左)</th>
                <td>{data.visionLeft}</td>
              </tr>
              <tr>
                <th>メガネ使用</th>
                <td>{data.glasses}</td>
                <th>利き腕</th>
                <td>{data.dominantArm}</td>
                <th>アレルギー</th>
                <td>{data.allergy}</td>
                <th>安全靴</th>
                <td>{data.safetyShoes}</td>
              </tr>
              <tr>
                <th>コロナワクチン</th>
                <td colSpan={7}>{data.vaccine}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <table className="info-table">
            <tbody>
              <tr>
                <th>通勤方法</th>
                <td>{data.commuteMethod}</td>
                <th>通勤片道時間（分）</th>
                <td>{data.commuteTimeMin}</td>
                <th>お弁当（社内食堂）</th>
                <td>{data.lunchPref}</td>
              </tr>
            </tbody>
          </table>
          <div className="site-footer-content">
            <div className="footer-logo-container">
              <img src="/logo.png" alt="UNS Logo" style={{maxHeight: '40px'}} />
              <div className="company-name">ユニバーサル企画株式会社</div>
            </div>
            <div className="company-details">
              <span>TEL 052-938-8840　FAX 052-938-8841</span>
            </div>
          </div>
        </div>

        <div className="applicant-id-footer">
          ID: {data.applicantId}
        </div>
      </div>

      <style>{`
        .rirekisho-print-container {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm;
          background: white;
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: black;
          box-sizing: border-box;
          position: relative;
        }

        .applicant-id-footer {
          position: absolute;
          bottom: 8mm;
          right: 8mm;
          font-size: 8pt;
          color: #555;
        }

        .print-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .print-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0;
        }

        .form-section {
          margin-bottom: 10px;
        }

        .basic-info-layout {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: 4mm;
        }
        
        .info-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .info-column > .info-table {
          flex-grow: 1;
        }

        .documents-section .info-table th,
        .documents-section .info-table td {
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .form-section h2 {
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 4px;
          margin-top: 8px;
          border-left: 4px solid #000;
          padding-left: 6px;
          background-color: #eee;
        }

        .photo-container {
          flex-shrink: 0;
          width: 35mm;
          height: 45mm;
        }

        .photo-frame {
          width: 100%;
          height: 100%;
          border: 1px solid black;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          color: #999;
          font-size: 9pt;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .info-table th,
        .info-table td {
          border: 1px solid black;
          padding: 4px 6px;
          font-size: 8.5pt;
          text-align: left;
          vertical-align: middle;
          word-wrap: break-word;
          height: 18px;
        }

        .personal-info-table .tall-row th,
        .personal-info-table .tall-row td {
          height: 22px;
          padding: 6px 8px;
        }

        .info-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          width: 15%; /* Default width for labels */
        }
        
        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }

        .qualifications-container {
          border: 1px solid black;
          padding: 5px;
        }

        .qualification-row {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          align-items: center;
        }

        .qualification-label {
          font-size: 9pt;
          white-space: nowrap;
        }

        .qualification-level {
          font-size: 8pt;
          color: #666;
        }

        /* Footer styles */
        .form-footer {
          margin-top: auto;
          padding-top: 10px;
        }

        .site-footer-content {
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }

        .company-details {
          font-size: 10pt;
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .footer-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        
        .company-name {
          font-size: 11pt;
          font-weight: bold;
        }

        @media print {
          .print-wrapper {
             padding: 0;
             background: white;
          }
          .rirekisho-print-container {
            margin: 0;
            padding: 10mm;
            border: none;
            box-shadow: none;
            width: 100%;
          }
          /* Hide non-printable elements */
          button, .fixed {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RirekishoPrintView;
