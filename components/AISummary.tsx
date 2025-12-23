
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getStaffInsights } from '../services/gemini';
import { Sparkles, BrainCircuit, RefreshCw, ChevronRight, Zap } from 'lucide-react';

const AISummary: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const allStaff = useLiveQuery(() => db.staff.toArray());

  const generateInsight = async () => {
    if (!allStaff) return;
    setLoading(true);
    const result = await getStaffInsights(allStaff);
    setInsight(result || '');
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-slate-50 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
            <Zap size={14} />
            Powered by Gemini AI
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Personnel Intelligence</h2>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            Get instant strategic insights from your workforce data. Analyze trends, risks, and performance benchmarks automatically.
          </p>
        </div>

        {/* Generate Card */}
        <div className="bg-white rounded-[2.5rem] p-1 shadow-xl shadow-blue-500/5 overflow-hidden">
          <div className="p-10 flex flex-col items-center text-center space-y-8">
            {!insight && !loading ? (
              <>
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500">
                  <BrainCircuit size={48} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Analyze Current Workforce</h3>
                  <p className="text-sm text-slate-400">Our AI will process your {allStaff?.length || 0} local records to provide a summary report.</p>
                </div>
                <button 
                  onClick={generateInsight}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-3"
                >
                  <Sparkles size={20} />
                  Generate AI Analysis
                </button>
              </>
            ) : loading ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <RefreshCw size={48} className="text-blue-500 animate-spin" strokeWidth={1.5} />
                <div className="space-y-1">
                   <p className="text-lg font-bold text-slate-800">Summarizing Staff Data...</p>
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Applying neural networks</p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 text-left">Strategic Executive Summary</h3>
                  </div>
                  <button 
                    onClick={() => setInsight('')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="bg-slate-50/50 rounded-3xl p-8 text-left">
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {insight}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SummaryFeature icon={<Zap size={16} />} text="Trend Prediction" />
                  <SummaryFeature icon={<Zap size={16} />} text="Risk Identification" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryFeature = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
    <div className="text-blue-500">{icon}</div>
    <span className="text-sm font-bold text-slate-700">{text}</span>
  </div>
);

export default AISummary;
