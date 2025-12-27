
import React, { useState, useEffect } from 'react';
import { resumeService } from '../lib/useSupabase';
import { Rirekisho } from '../types';
import { Save, Printer, Upload, Trash2, Plus, ArrowLeft, Globe, HeartPulse, ShieldAlert, Briefcase, Users, ThumbsUp, ThumbsDown, Scan, Loader2 } from 'lucide-react';
import RirekishoPrintView from './RirekishoPrintView';

// OCR API endpoint (backend Python)
const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000/api/ocr';

interface Props {
  resume?: Rirekisho;
  onClose: () => void;
}

const RirekishoForm: React.FC<Props> = ({ resume, onClose }) => {
  const [formData, setFormData] = useState<Rirekisho>({
    applicantId: resume?.applicantId || `UNS-${Math.floor(Math.random() * 1000000)}`,
    nameKanji: resume?.nameKanji || '',
    nameFurigana: resume?.nameFurigana || '',
    nameRomanji: resume?.nameRomanji || '',
    birthDate: resume?.birthDate || '',
    age: resume?.age || undefined,
    gender: resume?.gender || '',
    nationality: resume?.nationality || '',
    maritalStatus: resume?.maritalStatus || '',
    japanEntryDate: resume?.japanEntryDate || '',
    stayDuration: resume?.stayDuration || '',
    generation: resume?.generation || '',
    address: resume?.address || '',
    postalCode: resume?.postalCode || '',
    mobile: resume?.mobile || '',
    phone: resume?.phone || '',
    emergencyContact: resume?.emergencyContact || { name: '', relation: '', phone: '' },
    visaType: resume?.visaType || '',
    visaPeriod: resume?.visaPeriod || '',
    residenceCardNo: resume?.residenceCardNo || '',
    passportNo: resume?.passportNo || '',
    passportExpiry: resume?.passportExpiry || '',
    height: resume?.height || '',
    weight: resume?.weight || '',
    shoeSize: resume?.shoeSize || '',
    waist: resume?.waist || '',
    uniformSize: resume?.uniformSize || '',
    bloodType: resume?.bloodType || '',
    visionRight: resume?.visionRight || '',
    visionLeft: resume?.visionLeft || '',
    wearsGlasses: resume?.wearsGlasses || 'no',
    dominantArm: resume?.dominantArm || 'right',
    safetyShoes: resume?.safetyShoes || 'no',
    vaccineStatus: resume?.vaccineStatus || '',
    educationLevel: resume?.educationLevel || '',
    educationStatus: resume?.educationStatus || 'concluido',
    languageSkills: resume?.languageSkills || {
      conversation: '普通',
      listening: '普通',
      kanji: '少し',
      kanaRead: 'できる',
      kanaWrite: 'できる'
    },
    family: resume?.family || [],
    jobHistory: resume?.jobHistory || [],
    legacyRaw: resume?.legacyRaw || {},
    createdAt: resume?.createdAt || Date.now()
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    resume?.legacyRaw?.['写真'] ? `/photos/${resume.legacyRaw['写真']}` : null
  );
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);

  // Sync Age with Birthday
  useEffect(() => {
    if (formData.birthDate) {
      const age = new Date().getFullYear() - new Date(formData.birthDate).getFullYear();
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.birthDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setOcrLoading('card');
    try {
      const file = e.target.files[0];

      // Create FormData for backend API
      const formDataPayload = new FormData();
      formDataPayload.append('file', file);
      formDataPayload.append('document_type', 'zairyu_card');

      const response = await fetch(`${OCR_API_URL}/process`, {
        method: 'POST',
        body: formDataPayload
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          nameKanji: result.full_name_kanji || result.name_kanji || prev.nameKanji,
          birthDate: result.date_of_birth || result.birthday || prev.birthDate,
          address: result.current_address || result.address || prev.address,
          postalCode: result.postal_code || prev.postalCode,
          visaType: result.residence_status || result.visa_status || prev.visaType,
          residenceCardNo: result.residence_card_number || result.zairyu_card_number || prev.residenceCardNo,
          visaPeriod: result.visa_period || prev.visaPeriod,
          nationality: result.nationality || prev.nationality
        }));
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR processing failed. Make sure the backend server is running.');
    } finally {
      setOcrLoading(null);
    }
  };

  const save = async () => {
    try {
      if (resume?.id) {
        await resumeService.update(resume.id, formData as any);
      } else {
        await resumeService.create(formData as any);
      }
      onClose();
    } catch (e) {
      alert('Error: ' + e);
    }
  };

  if (isPrinting) {
    return <RirekishoPrintView resume={formData} onClose={() => setIsPrinting(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fbfcfd] overflow-y-auto font-sans text-slate-800">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex justify-between items-center sticky top-4 z-40 border border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-blue-900">履歴書</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel Entry System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsPrinting(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-200">
               <Printer size={18} /> Print
             </button>
             <button onClick={save} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
               <Save size={18} /> Save Data
             </button>
          </div>
        </header>

        <main className="space-y-8 pb-20">
          
          {/* SECTION 1: BASIC INFO */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
            <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-2">
               <Users size={20} className="text-blue-600" /> 基本情報
            </h2>
            
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Photo Area */}
              <div className="flex-shrink-0">
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Profile Photo</label>
                 <label className="w-40 h-52 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden relative group">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="text-slate-300 text-center">
                        <Upload size={40} className="mx-auto mb-3 opacity-30" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Upload Photo</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </label>
              </div>

              {/* Fields Area */}
              <div className="flex-1 w-full space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="氏名 (漢字)" name="nameKanji" value={formData.nameKanji} onChange={handleChange} placeholder="山田 太郎" />
                    <InputGroup label="ローマ字氏名" name="nameRomanji" value={formData.nameRomanji} onChange={handleChange} placeholder="Yamada Taro" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                       <InputGroup label="ふりがな" name="nameFurigana" value={formData.nameFurigana} onChange={handleChange} placeholder="ヤマダ タロウ" />
                    </div>
                    <InputGroup label="応募者ID" name="applicantId" value={formData.applicantId} onChange={handleChange} readOnly className="bg-slate-50 border-transparent text-slate-400" />
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InputGroup label="生年月日" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
                    <InputGroup label="年齢" name="age" type="number" value={formData.age} onChange={handleChange} />
                    <SelectGroup label="性別" name="gender" value={formData.gender} onChange={handleChange} options={['男', '女']} />
                    <SelectGroup label="婚姻" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={['既婚', '未婚']} />
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InputGroup label="来日年月日" name="japanEntryDate" type="date" value={formData.japanEntryDate} onChange={handleChange} />
                    <InputGroup label="滞在年数" name="stayDuration" value={formData.stayDuration} onChange={handleChange} placeholder="例: 10年" />
                    <div className="md:col-span-2">
                       <SelectGroup label="国籍" name="nationality" value={formData.nationality} onChange={handleChange} options={['日本', 'ベトナム', 'ブラジル', 'ペルー', 'フィリピン', 'その他']} />
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: CONTACT & EMERGENCY */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
            <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-2">
               <Globe size={20} className="text-orange-500" /> 連絡先・緊急連絡先
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <InputGroup label="郵便番号" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="000-0000" />
               <div className="md:col-span-3">
                  <InputGroup label="現住所" name="address" value={formData.address} onChange={handleChange} placeholder="住所を入力" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
               <InputGroup label="携帯電話" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="090-0000-0000" />
               <InputGroup label="電話番号" name="phone" value={formData.phone} onChange={handleChange} placeholder="052-000-0000" />
            </div>

            <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
               <h3 className="text-sm font-black text-orange-700 uppercase tracking-widest mb-4">緊急連絡先</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputGroup label="氏名" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                  <InputGroup label="続柄" name="emergencyContact.relation" value={formData.emergencyContact?.relation} onChange={handleChange} />
                  <InputGroup label="電話番号" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
               </div>
            </div>
          </section>

          {/* SECTION 3: LANGUAGE & EDUCATION */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
            <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-2">
               <Globe size={20} className="text-indigo-600" /> 語学力・学歴
            </h2>
            
            <div className="overflow-x-auto mb-10">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="text-slate-400 border-b border-slate-100">
                        <th className="pb-4 text-left font-black uppercase tracking-widest text-[10px]">項目</th>
                        <th className="pb-4 text-left font-black uppercase tracking-widest text-[10px]">評価</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     <LanguageRow label="会話ができる" name="languageSkills.conversation" value={formData.languageSkills?.conversation} onChange={handleChange} options={['良い', '普通', '少し']} />
                     <LanguageRow label="会話が理解できる" name="languageSkills.listening" value={formData.languageSkills?.listening} onChange={handleChange} options={['良い', '普通', '少し']} />
                     <LanguageRow label="漢字の読み書き" name="languageSkills.kanji" value={formData.languageSkills?.kanji} onChange={handleChange} options={['できる', '少し', 'できない']} />
                     <LanguageRow label="ひらがな・カタカナ読める" name="languageSkills.kanaRead" value={formData.languageSkills?.kanaRead} onChange={handleChange} options={['できる', '少し', 'できない']} />
                     <LanguageRow label="ひらがな・カタカナ書ける" name="languageSkills.kanaWrite" value={formData.languageSkills?.kanaWrite} onChange={handleChange} options={['できる', '少し', 'できない']} />
                  </tbody>
               </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
               <div className="md:col-span-2">
                  <InputGroup label="最終学歴" name="educationLevel" value={formData.educationLevel} onChange={handleChange} placeholder="大学・高校名など" />
               </div>
               <SelectGroup label="修了状況" name="educationStatus" value={formData.educationStatus} onChange={handleChange} options={['完了', '中断']} />
            </div>
          </section>

          {/* SECTION 4: PHYSICAL */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-2">
               <HeartPulse size={20} className="text-emerald-500" /> 身体情報・健康状態
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
               <InputGroup label="身長 [cm]" name="height" type="number" value={formData.height} onChange={handleChange} />
               <InputGroup label="体重 [kg]" name="weight" type="number" value={formData.weight} onChange={handleChange} />
               <InputGroup label="服サイズ" name="uniformSize" value={formData.uniformSize} onChange={handleChange} placeholder="S/M/L" />
               <InputGroup label="ウエスト [cm]" name="waist" type="number" value={formData.waist} onChange={handleChange} />
               <InputGroup label="靴サイズ [cm]" name="shoeSize" type="number" value={formData.shoeSize} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                     <InputGroup label="血液型" name="bloodType" value={formData.bloodType} onChange={handleChange} />
                     <InputGroup label="視力 右" name="visionRight" value={formData.visionRight} onChange={handleChange} />
                     <InputGroup label="視力 左" name="visionLeft" value={formData.visionLeft} onChange={handleChange} />
                  </div>
                  <RadioGroup label="安全靴持参" name="safetyShoes" value={formData.safetyShoes} onChange={handleChange} options={[{v:'yes', l:'有'}, {v:'no', l:'無'}]} />
               </div>
               <div className="space-y-6">
                  <RadioGroup label="メガネ使用" name="wearsGlasses" value={formData.wearsGlasses} onChange={handleChange} options={[{v:'yes', l:'有'}, {v:'no', l:'無'}]} />
                  <RadioGroup label="利き腕" name="dominantArm" value={formData.dominantArm} onChange={handleChange} options={[{v:'right', l:'右'}, {v:'left', l:'左'}]} />
               </div>
            </div>
          </section>

          {/* SECTION 5: FAMILY */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500" />
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-pink-500" /> 家族構成
               </h2>
               <button onClick={() => setFormData(prev => ({ ...prev, family: [...(prev.family || []), { name: '', relation: '', age: '', residence: '同居' }] }))} className="px-4 py-2 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-pink-100 transition-all">
                  <Plus size={14} /> 家族を追加
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                        <th className="p-4 rounded-tl-xl">氏名</th>
                        <th className="p-4">続柄</th>
                        <th className="p-4">年齢</th>
                        <th className="p-4">居住</th>
                        <th className="p-4 rounded-tr-xl w-16 text-center">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {formData.family?.map((member: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="p-2"><input type="text" value={member.name} onChange={(e) => {
                              const newList = [...(formData.family || [])];
                              newList[idx].name = e.target.value;
                              setFormData({...formData, family: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-400 outline-none" /></td>
                           <td className="p-2"><input type="text" value={member.relation} onChange={(e) => {
                              const newList = [...(formData.family || [])];
                              newList[idx].relation = e.target.value;
                              setFormData({...formData, family: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-400 outline-none" /></td>
                           <td className="p-2 w-20"><input type="number" value={member.age} onChange={(e) => {
                              const newList = [...(formData.family || [])];
                              newList[idx].age = e.target.value;
                              setFormData({...formData, family: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-400 outline-none" /></td>
                           <td className="p-2 w-32"><select value={member.residence} onChange={(e) => {
                              const newList = [...(formData.family || [])];
                              newList[idx].residence = e.target.value;
                              setFormData({...formData, family: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-400 outline-none">
                              <option>同居</option><option>別居</option><option>国外</option>
                           </select></td>
                           <td className="p-2 text-center">
                              <button onClick={() => setFormData(prev => ({ ...prev, family: prev.family?.filter((_, i) => i !== idx) }))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </section>

          {/* SECTION 6: JOBS */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase size={20} className="text-cyan-500" /> 職務経歴
               </h2>
               <button onClick={() => setFormData(prev => ({ ...prev, jobHistory: [...(prev.jobHistory || []), { start: '', end: '', hakenmoto: '', content: '' }] }))} className="px-4 py-2 bg-cyan-50 text-cyan-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-cyan-100 transition-all">
                  <Plus size={14} /> 職歴を追加
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                        <th className="p-4 rounded-tl-xl w-32">開始 (YM)</th>
                        <th className="p-4 w-32">終了 (YM)</th>
                        <th className="p-4">派遣元/会社名</th>
                        <th className="p-4">作業内容</th>
                        <th className="p-4 rounded-tr-xl w-16 text-center">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {formData.jobHistory?.map((job: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="p-2"><input type="text" value={job.start} placeholder="2020/04" onChange={(e) => {
                              const newList = [...(formData.jobHistory || [])];
                              newList[idx].start = e.target.value;
                              setFormData({...formData, jobHistory: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-cyan-400 outline-none" /></td>
                           <td className="p-2"><input type="text" value={job.end} placeholder="2021/03" onChange={(e) => {
                              const newList = [...(formData.jobHistory || [])];
                              newList[idx].end = e.target.value;
                              setFormData({...formData, jobHistory: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-cyan-400 outline-none" /></td>
                           <td className="p-2"><input type="text" value={job.hakenmoto} onChange={(e) => {
                              const newList = [...(formData.jobHistory || [])];
                              newList[idx].hakenmoto = e.target.value;
                              setFormData({...formData, jobHistory: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-cyan-400 outline-none" /></td>
                           <td className="p-2"><input type="text" value={job.content} onChange={(e) => {
                              const newList = [...(formData.jobHistory || [])];
                              newList[idx].content = e.target.value;
                              setFormData({...formData, jobHistory: newList});
                           }} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-cyan-400 outline-none" /></td>
                           <td className="p-2 text-center">
                              <button onClick={() => setFormData(prev => ({ ...prev, jobHistory: prev.jobHistory?.filter((_, i) => i !== idx) }))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </section>

          {/* SECTION 7: OCR */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-900" />
             <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <ShieldAlert size={20} className="text-blue-900" /> 書類 OCR 自動入力
             </h2>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">AI Document Processing</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="border-2 border-dashed border-slate-200 p-10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                   <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      <Upload size={28} />
                   </div>
                   <h3 className="font-black text-slate-700 uppercase tracking-tight">在留カード</h3>
                   <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest text-center">Upload Residence Card<br/>to Auto-Fill Name/Address</p>
                   {ocrLoading === 'card' && <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs"><div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"/> Processing...</div>}
                   <input type="file" className="hidden" accept="image/*" onChange={handleOCR} />
                </label>
             </div>
          </section>

          {/* SECTION 8: QUICK EVALUATION */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800" />
             <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <ThumbsUp size={20} className="text-slate-800" /> クイック評価 (Quick Evaluation)
             </h2>
             
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">面接結果 (Interview Result)</label>
                      <div className="flex gap-4">
                         <button 
                           onClick={() => setFormData({...formData, interviewResult: 'passed'})}
                           className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${formData.interviewResult === 'passed' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-lg shadow-emerald-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                            <ThumbsUp size={20} /> 合格 (Passed)
                         </button>
                         <button 
                           onClick={() => setFormData({...formData, interviewResult: 'failed'})}
                           className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${formData.interviewResult === 'failed' ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-lg shadow-rose-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                            <ThumbsDown size={20} /> 不合格 (Failed)
                         </button>
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">評価コメント (Notes)</label>
                      <textarea 
                        name="evaluationNotes"
                        value={formData.evaluationNotes || ''}
                        onChange={handleChange}
                        className="w-full h-[88px] bg-slate-50 border border-transparent rounded-2xl p-4 text-sm focus:bg-white focus:border-slate-200 outline-none transition-all resize-none"
                        placeholder="Evaluation notes..."
                      />
                   </div>
                </div>
             </div>
          </section>

        </main>
      </div>
    </div>
  );
};

// Reusable Sub-Components
const InputGroup = ({ label, name, value, onChange, type = "text", placeholder, readOnly, className = "" }: any) => (
  <div className="flex-1 min-w-0">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium ${className}`}
      placeholder={placeholder}
    />
  </div>
);

const SelectGroup = ({ label, name, value, onChange, options }: any) => (
  <div className="flex-1 min-w-0">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{label}</label>
    <select 
      name={name} 
      value={value || ''} 
      onChange={onChange}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
    >
      <option value="">選択</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const LanguageRow = ({ label, name, value, onChange, options }: any) => (
  <tr>
    <td className="py-4 font-bold text-slate-700">{label}</td>
    <td className="py-2">
       <select name={name} value={value} onChange={onChange} className="w-full max-w-[120px] bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-blue-700 outline-none">
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
       </select>
    </td>
  </tr>
);

const RadioGroup = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{label}</label>
    <div className="flex gap-4">
       {options.map((o: any) => (
          <label key={o.v} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${value === o.v ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
             <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={onChange} className="hidden" />
             <div className={`w-3 h-3 rounded-full border-2 ${value === o.v ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`} />
             {o.l}
          </label>
       ))}
    </div>
  </div>
);

export default RirekishoForm;
