import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { Users, Pill, Activity, ArrowLeft, AlertCircle, Calendar, ChevronDown, Search, X, Database, AlertTriangle, HeartPulse, Shuffle, Building2, Loader2, ClipboardCheck, Printer, Copy, ShieldCheck, ChevronLeft } from 'lucide-react';
import './index.css';

const API_BASE = "http://127.0.0.1:5000/api";
const categories = ["Cardiovascular", "Dermatologic", "Endocrine & metabolic", "Gastrointestinal", "Genitourinary", "Hematologic & oncologic", "Hepatic", "Local", "Nervous system", "Neuromuscular & skeletal", "Respiratory", "Otic", "Renal", "Hypersensitivity", "Immunologic", "Psychiatric", "Musculoskeletal", "Ophthalmic", "Miscellaneous"];

const LAB_DICTIONARY = [
    { term: "increased serum alanine aminotransferase", label: "ALT", type: "up" }, { term: "decreased serum alanine aminotransferase", label: "ALT", type: "down" },
    { term: "increased serum aspartate aminotransferase", label: "AST", type: "up" }, { term: "decreased serum aspartate aminotransferase", label: "AST", type: "down" },
    { term: "increased serum alkaline phosphatase", label: "ALKP", type: "up" }, { term: "decreased serum alkaline phosphatase", label: "ALKP", type: "down" },
    { term: "Increased gamma-glutamyl transferase", label: "GGT", type: "up" }, { term: "decreased gamma-glutamyl transferase", label: "GGT", type: "down" },
    { term: "Hyperbilirubinemia", label: "Bilirubin", type: "up" }, { term: "increased serum bilirubin", label: "Bilirubin", type: "up" },
    { term: "Hypobilirubinemia", label: "Bilirubin", type: "down" }, { term: "decreased serum bilirubin", label: "Bilirubin", type: "down" },
    { term: "increased lactate dehydrogenase", label: "LDH", type: "up" }, { term: "decreased lactate dehydrogenase", label: "LDH", type: "down" },
    { term: "Increased blood urea nitrogen", label: "BUN", type: "up" }, { term: "decreased blood urea nitrogen", label: "BUN", type: "down" },
    { term: "Increased serum creatinine", label: "SCr", type: "up" }, { term: "decreased serum creatinine", label: "SCr", type: "down" },
    { term: "increased serum cholesterol", label: "Cholesterol", type: "up" }, { term: "hypercholesterolemia", label: "Cholesterol", type: "up" },
    { term: "decreased serum cholesterol", label: "Cholesterol", type: "down" }, { term: "hypocholesterolemia", label: "Cholesterol", type: "down" },
    { term: "Increased HDL cholesterol", label: "HDL", type: "up" }, { term: "decreased HDL cholesterol", label: "HDL", type: "down" },
    { term: "increased LDL cholesterol", label: "LDL", type: "up" }, { term: "decreased LDL cholesterol", label: "LDL", type: "down" },
    { term: "increased serum triglycerides", label: "TG", type: "up" }, { term: "hypertriglyceridemia", label: "TG", type: "up" },
    { term: "hypotriglyceridemia", label: "TG", type: "down" }, { term: "decreased serum triglycerides", label: "TG", type: "down" },
    { term: "increased serum glucose", label: "Glucose", type: "up" }, { term: "Hyperglycemia", label: "Glucose", type: "up" },
    { term: "decreased serum glucose", label: "Glucose", type: "down" }, { term: "Hypoglycemia", label: "Glucose", type: "down" },
    { term: "increased serum sodium", label: "Na", type: "up" }, { term: "Hypernatremia", label: "Na", type: "up" },
    { term: "decreased serum sodium", label: "Na", type: "down" }, { term: "Hyponatremia", label: "Na", type: "down" },
    { term: "increased serum potassium", label: "K", type: "up" }, { term: "Hyperkalemia", label: "K", type: "up" },
    { term: "decreased serum potassium", label: "K", type: "down" }, { term: "hypokalemia", label: "K", type: "down" },
    { term: "hyperchloremia", label: "Cl", type: "up" }, { term: "Hyperchloremic metabolic acidosis", label: "Cl", type: "up" }, { term: "hypochloremia", label: "Cl", type: "down" },
    { term: "increased serum phosphate", label: "P", type: "up" }, { term: "hyperphosphatemia", label: "P", type: "up" },
    { term: "hypophosphatemia", label: "P", type: "down" }, { term: "decreased serum phosphate", label: "P", type: "down" },
    { term: "hypercalcemia", label: "Ca", type: "up" }, { term: "increased serum Calcium", label: "Ca", type: "up" },
    { term: "hypocalcemia", label: "Ca", type: "down" }, { term: "decreased serum calcium", label: "Ca", type: "down" },
    { term: "hypermagnesemia", label: "Mg", type: "up" }, { term: "decreased serum magnesium", label: "Mg", type: "down" },
    { term: "leukocytosis", label: "WBC", type: "up" }, { term: "leukopenia", label: "WBC", type: "down" }, { term: "decreased white blood cell count", label: "WBC", type: "down" }, { term: "Agranulocytosis", label: "WBC", type: "down" },
    { term: "Increased neutrophils", label: "Neutrophil", type: "up" }, { term: "neutropenia", label: "Neutrophil", type: "down" }, { term: "Decreased neutrophils", label: "Neutrophil", type: "down" },
    { term: "thrombocytosis", label: "PLT", type: "up" }, { term: "thrombocytopenia", label: "PLT", type: "down" }, { term: "decreased platelet count", label: "PLT", type: "down" },
    { term: "increased hemoglobin", label: "Hb", type: "up" }, { term: "Anemia", label: "Hb", type: "down" }, { term: "Decreased hemoglobin", label: "Hb", type: "down" },
    { term: "increased serum amylase", label: "Amylase", type: "up" }, { term: "decreased serum amylase", label: "Amylase", type: "down" },
    { term: "increased serum lipase", label: "Lipase", type: "up" }, { term: "decreased serum lipase", label: "Lipase", type: "down" },
    { term: "increased uric acid", label: "UA", type: "up" }, { term: "decreased uric acid", label: "UA", type: "down" },
    { term: "prolonged QT interval", label: "QT Prolonged", type: "up" }
];

export default function App() {
  const [view, setView] = useState('overview'); 
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [currentAdm, setCurrentAdm] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [windowSize, setWindowSize] = useState(7);
  const [startIndex, setStartIndex] = useState(0);
  const [isAdmMenuOpen, setIsAdmMenuOpen] = useState(false);

  // 藥物查詢與詳情狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, with_reactions: 0 });
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentLabel, setCurrentLabel] = useState('所有藥物列表');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // 初始化載入
  useEffect(() => {
    fetch(`${API_BASE}/patients`).then(res => res.json()).then(setPatients).catch(() => {});
    fetch(`${API_BASE}/stats`).then(res => res.json()).then(setStats).catch(() => {});
  }, []);

  const handleSelectPatient = (p) => {
    fetch(`${API_BASE}/patients/${p.id}/admissions`)
      .then(res => res.json())
      .then(data => { setAdmissions(data); if(data.length > 0) handleSelectAdmission(data[0]); setView('dashboard'); });
  };

  const handleSelectAdmission = (adm) => {
    setCurrentAdm(adm); setIsAdmMenuOpen(false); setClinicalData(null);
    fetch(`${API_BASE}/admissions/${adm.id}/details`).then(res => res.json()).then(data => { setClinicalData(data); setStartIndex(0); });
  };

  const performSearch = async (params, labelText) => {
    setIsLoading(true); setCurrentLabel(labelText);
    try {
      const q = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/search?${q}`);
      const json = await res.json();
      setSearchResults(json.data || []);
    } finally { setIsLoading(false); }
  };

  // 完整還原的智慧格式化函數 (紅藍標籤、黃色螢光筆)
  const formatAndReplaceText = (text) => {
    if (!text || String(text).toLowerCase() === 'nan') return '<span class="text-slate-400">無資料</span>';

    let processed = String(text)
        .replace(/^Adverse Reactions\s*/i, '')
        .replace(/\(Ref\s*\)/gi, '')
        .replace(/:?style="[^"]*"\s*class="[^"]*">/gi, '') 
        .replace(/style=.*?>/gi, '')
        .replace(/<[^>]*>/g, '') 
        .replace(/\[\s*link to .*?\]/gi, '');

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    LAB_DICTIONARY.forEach(item => {
        const regex = new RegExp(escapeRegExp(item.term), 'gi');
        const colorClass = item.type === 'up' ? 'text-rose-700 bg-rose-100 border-rose-200 print:border-rose-500' : 'text-blue-700 bg-blue-100 border-blue-200 print:border-blue-500';
        const icon = item.type === 'up' ? '⬆' : '⬇';
        const replacement = `<span class="inline-flex items-center px-2 py-0.5 mx-1 rounded text-[11px] font-black tracking-widest border ${colorClass} align-text-bottom shadow-sm print:shadow-none">${item.label} ${icon}</span>`;
        processed = processed.replace(regex, replacement);
    });

    const sections = ["Frequency not defined", "Postmarketing", ">10%", "1% to 10%", "<1%", "≥10%"];
    const secPattern = new RegExp(`(${sections.map(escapeRegExp).join('|')}):?`, 'gi');
    processed = processed.replace(secPattern, `<div class="mt-8 mb-3 p-3 bg-slate-50 border-l-4 border-blue-600 font-black text-slate-800 text-xl rounded-r-lg shadow-sm print:shadow-none print:border-black print:bg-transparent print:p-0 print:border-l-0 print:mt-4 print:mb-2">$1</div>`);

    const catPattern = new RegExp(`(${categories.map(escapeRegExp).join('|')}):`, 'gi');
    processed = processed.replace(catPattern, `<br><strong class="text-amber-800 bg-amber-100/60 px-2 py-1 rounded text-lg mt-4 mb-2 inline-block border border-amber-200/50 print:border-none print:bg-transparent print:text-black print:p-0">$1:</strong>`);

    if (processed.startsWith('<br>')) processed = processed.replace(/^(<br>)+/, '');

    return `<div class="text-lg leading-relaxed text-slate-700 font-medium print:text-black">${processed}</div>`;
  };

  const copyToClipboard = () => {
    if (!selectedDrug) return;
    const cleanText = (htmlStr) => { const temp = document.createElement('div'); temp.innerHTML = formatAndReplaceText(htmlStr); return temp.innerText.trim(); };
    let textToCopy = `【藥物名稱】${selectedDrug.name}\n\n`;
    if (selectedDrug.adverse_reaction && String(selectedDrug.adverse_reaction).toLowerCase() !== 'nan') { textToCopy += `【不良反應】\n${cleanText(selectedDrug.adverse_reaction)}\n\n`; }
    navigator.clipboard.writeText(textToCopy).then(() => { setShowCopyToast(true); setTimeout(() => setShowCopyToast(false), 2000); });
  };

  // --- 模組化介面：側邊欄 ---
  const renderSidebar = () => (
    <div className="w-64 bg-white border-r p-6 flex flex-col shadow-sm print:hidden z-10">
      <div className="flex items-center gap-2 text-blue-600 font-bold mb-10 text-xl italic"><Activity strokeWidth={3}/> ADR PRO</div>
      <button onClick={() => setView('overview')} className={"flex items-center gap-3 p-4 rounded-2xl font-bold mb-4 transition-all " + (view === 'overview' || view === 'dashboard' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}>
        <Users size={18} /> 患者住院紀錄
      </button>
      <button onClick={() => { setView('repository'); setSearchQuery(''); setSelectedCategory(''); performSearch({}, '完整收錄藥物'); setShowCategories(false); }} className={"flex items-center gap-3 p-4 rounded-2xl font-bold transition-all " + (view === 'repository' || view === 'drug_detail' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}>
        <Pill size={18} /> 藥物查詢
      </button>
    </div>
  );

  // --- 模組化介面：圖表儀表板 (保留完整功能) ---
  const renderDashboard = () => {
    if(!clinicalData) return <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">載入中...</div>;
    const visibleTrends = clinicalData.trends.slice(startIndex, startIndex + windowSize);
    
    return (
      <div className="flex-1 p-8 overflow-y-auto print:hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 relative">
            <button onClick={() => setView('overview')} className="p-3 bg-white border rounded-xl shadow-sm"><ArrowLeft size={18} /></button>
            <button onClick={() => setIsAdmMenuOpen(!isAdmMenuOpen)} className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <Calendar size={16} className="text-blue-500"/> {currentAdm?.date} <ChevronDown size={14} />
            </button>
            {isAdmMenuOpen && (
              <div className="absolute top-14 left-14 mt-2 w-72 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                {admissions.map(adm => (
                  <div key={adm.id} onClick={() => handleSelectAdmission(adm)} className="px-6 py-4 hover:bg-blue-50 cursor-pointer font-bold border-b last:border-b-0 text-slate-600">{adm.date}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {[3, 7, 14].map(d => (
              <button key={d} onClick={() => { setWindowSize(d); setStartIndex(0); }} className={windowSize === d ? "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs" : "px-6 py-2 bg-white text-slate-400 border font-bold text-xs"}>{d}D</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-8">
          <div className="h-80 w-full mb-6">
            <ResponsiveContainer>
              <LineChart data={visibleTrends} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis yAxisId="na" domain={[120, 160]} ticks={[120, 130, 140, 150, 160]} axisLine={false} tickLine={false} tick={{fill: '#F97316', fontSize: 10, fontWeight: 'bold'}} width={40} />
                <YAxis yAxisId="k" orientation="right" domain={[2, 8]} ticks={[2, 4, 6, 8]} axisLine={false} tickLine={false} tick={{fill: '#6366F1', fontSize: 10, fontWeight: 'bold'}} width={40} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                <ReferenceArea yAxisId="na" y1={135} y2={145} fill="#F97316" fillOpacity={0.05}><Label value="Na Range (135-145)" position="insideTopLeft" fill="#F97316" fontSize={10} fontWeight="bold" /></ReferenceArea>
                <ReferenceArea yAxisId="k" y1={3.5} y2={5.0} fill="#6366F1" fillOpacity={0.05}><Label value="K Range (3.5-5.0)" position="insideBottomRight" fill="#6366F1" fontSize={10} fontWeight="bold" /></ReferenceArea>
                <Line yAxisId="na" type="monotone" dataKey="na" stroke="#F97316" strokeWidth={5} dot={{r: 6, fill: '#F97316', strokeWidth: 3, stroke: '#fff'}} isAnimationActive={false} />
                <Line yAxisId="k" type="monotone" dataKey="k" stroke="#6366F1" strokeWidth={5} dot={{r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff'}} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="px-10 mb-12">
            <input type="range" min="0" max={Math.max(0, clinicalData.trends.length - windowSize)} value={startIndex} onChange={(e) => setStartIndex(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-[10px] font-black text-slate-400 mt-4 uppercase">
              <span>住院開始 ({clinicalData.trends[0].date})</span>
              <span className="text-blue-600 font-bold bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 italic">平移檢視: {visibleTrends[0].date} - {visibleTrends[visibleTrends.length-1].date}</span>
              <span>住院結束 ({clinicalData.trends[clinicalData.trends.length-1].date})</span>
            </div>
          </div>
          
          <div className="space-y-4 pt-10 border-t border-slate-100 mt-10">
            {clinicalData.gantt.map((med, i) => {
              const left = Math.max(0, ((med.startIdx - startIndex) / windowSize) * 100);
              const right = Math.min(100, ((med.endIdx - startIndex + 1) / windowSize) * 100);
              const width = Math.max(0, right - left);
              return (
                <div key={i} className="flex items-center">
                  <div className="w-48 text-left pr-4 leading-tight">
                    <p className="text-[11px] font-black text-slate-700 italic uppercase">{med.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{med.type}</p>
                  </div>
                  <div className="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 shadow-inner">
                    {width > 0 && (
                      <div className="absolute h-full opacity-80 rounded-lg shadow-sm flex items-center px-4 transition-all" style={{ left: left + '%', width: width + '%', backgroundColor: med.color }}>
                        <span className="text-[8px] text-white font-black uppercase whitespace-nowrap">{med.startDate} - {med.endDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-8 text-left">
           <h2 className="font-black text-slate-700 mb-8 border-l-4 border-blue-600 pl-4 uppercase tracking-tighter italic">實際用藥全紀錄 (住院詳細明細)</h2>
           <table className="w-full text-sm">
              <thead className="text-slate-400 border-b text-left"><tr><th className="pb-4">藥物名稱</th><th className="pb-4">開始時間</th><th className="pb-4">停止時間</th><th className="pb-4">劑量變動</th><th className="pb-4 text-right">狀態</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {clinicalData.logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all">
                    <td className="py-6 font-black italic text-slate-700">{log.name}</td>
                    <td className="py-6 text-slate-400 font-mono">{log.start}</td>
                    <td className="py-6 text-slate-400 font-mono">{log.end}</td>
                    <td className="py-6 font-bold text-slate-600">{log.dose.join(' / ')}</td>
                    <td className="py-6 text-right"><span className={log.status === 'ACTIVE' ? "text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-100" : "text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-bold border border-slate-200"}>{log.status}</span></td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-12 text-left">
          <div className="bg-rose-50/50 p-6 -m-10 mb-10 rounded-t-3xl border-b border-rose-100 flex items-center gap-3"><AlertCircle className="text-rose-500"/><h2 className="text-rose-900 font-black italic text-xl uppercase">ADR 關聯分析結論</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="p-8 text-left">臨床肇因藥物</th><th className="p-8 text-left">影響維度</th><th className="p-8 text-center">檢驗值變化</th><th className="p-8 text-right">智慧判定結果</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {clinicalData.gantt.map((med, i) => (
                <tr key={i} className="hover:bg-rose-50/30 transition-all">
                  <td className="p-8 font-black text-slate-700 italic">{med.name} {med.level.includes('高') && <span className="bg-rose-100 text-rose-500 text-[8px] px-2 py-0.5 rounded font-black ml-2 uppercase">Critical</span>}</td>
                  <td className="p-8 text-slate-400 font-bold uppercase">{med.type}</td>
                  <td className="p-8 font-mono font-black text-2xl italic text-center text-rose-500">{med.impact}</td>
                  <td className="p-8 text-right"><span className="px-10 py-4 rounded-3xl text-xs font-black uppercase text-white shadow-xl inline-block" style={{ backgroundColor: med.level.includes('高') ? '#F43F5E' : med.level.includes('中') ? '#F97316' : '#94A3B8' }}>{med.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`@media print { html, body, #root { height: auto !important; overflow: visible !important; display: block !important; } .print:hidden { display: none !important; } }`}</style>
      <div className="flex h-screen bg-[#F8FAFC] font-sans text-left print:block print:h-auto print:bg-white">
        {renderSidebar()}
        
        {/* 患者住院紀錄 (首頁) */}
        {view === 'overview' && (
          <div className="flex-1 p-12 overflow-y-auto">
            <h1 className="text-2xl font-black italic text-slate-800 mb-8 border-b-[3px] border-blue-600 inline-block pb-1 uppercase tracking-tighter">患者住院紀錄</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-6xl">
              <table className="w-full text-left">
                <thead className="bg-white border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest"><tr><th className="py-6 px-8">病歷 ID</th><th className="py-6 px-8">病患</th><th className="py-6 px-8 text-center">Na+ / K+</th><th className="py-6 px-8 text-right pr-12">監測狀態</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map(p => (
                    <tr key={p.id} onClick={() => handleSelectPatient(p)} className="hover:bg-blue-50/50 transition-all cursor-pointer group">
                      <td className="py-6 px-8 font-black text-blue-600 text-sm">{p.id}</td>
                      <td className="py-6 px-8 text-slate-700 font-bold text-sm">{p.name} <span className="text-slate-400 font-normal ml-1">{p.info}</span></td>
                      <td className="py-6 px-8 font-sans font-bold text-base text-center"><span className="text-slate-700">{p.na}</span> <span className="text-slate-400 mx-1">/</span> <span className="text-slate-700">{p.k}</span></td>
                      <td className="py-6 px-8 text-right pr-12"><span className="bg-rose-100 text-rose-600 px-5 py-1.5 rounded-full text-[11px] font-bold border border-rose-100">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'dashboard' && renderDashboard()}

        {/* 完美還原：藥物查詢介面 */}
        {view === 'repository' && (
          <div className="flex-1 overflow-y-auto relative bg-[#f8fafc] print:hidden">
            <div className={"w-full flex flex-col items-center transition-all duration-500 ease-in-out " + (searchResults.length > 0 ? "pt-8 pb-6 border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm" : "pt-[20vh]")}>
              <div className={"text-center transition-all duration-500 " + (searchResults.length > 0 ? "mb-4 flex items-center gap-3" : "mb-8")}>
                <h1 className={"font-bold text-[#0f4c81] flex items-center justify-center gap-2 " + (searchResults.length > 0 ? "text-2xl" : "text-4xl")}><Building2 size={searchResults.length > 0 ? 28 : 40} /> 台北榮總藥物查詢</h1>
                {searchResults.length === 0 && <p className="text-slate-500 text-lg mt-3 font-bold tracking-widest">臨床醫師專用搜尋引擎</p>}
              </div>

              <div className="w-full max-w-2xl px-6">
                <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-3 shadow-lg">
                  <Search className="text-slate-400 mr-3 cursor-pointer" size={22} onClick={() => { if(searchQuery.trim()) { setSelectedCategory(''); performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery); } }} />
                  <input 
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setSelectedCategory(''); performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery); } }}
                    className="flex-1 outline-none text-xl text-slate-800 bg-transparent" placeholder="輸入藥名或代碼..."
                  />
                  {searchQuery && <X className="text-slate-400 cursor-pointer ml-3" size={24} onClick={() => { setSearchQuery(''); setSearchResults([]); }} />}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-8 px-6 font-bold text-sm">
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); performSearch({}, '完整收錄藥物'); }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#0f4c81] text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white bg-white shadow-sm transition-colors">
                  <Database size={18} /> 收錄藥物 <span className="bg-[#0f4c81] text-white px-2 py-0.5 rounded-full text-xs ml-1">{stats.total || '-'}</span>
                </button>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); performSearch({ filter: 'reactions' }, '含不良反應資料庫'); }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white bg-white shadow-sm transition-colors">
                  <AlertTriangle size={18} /> 不良反應藥物 <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs ml-1">{stats.with_reactions || '-'}</span>
                </button>
                <button onClick={() => setShowCategories(!showCategories)} className="flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white bg-white shadow-sm transition-colors">
                  <HeartPulse size={18} /> 身體反應分類 <ChevronDown size={16} className={showCategories ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
              </div>

              {showCategories && (
                <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-4xl w-full mx-6 text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.map(sys => (
                      <span key={sys} onClick={() => { setSearchQuery(''); setShowCategories(false); setSelectedCategory(sys); performSearch({ category: sys }, "分類：" + sys); }}
                        className={"px-4 py-1.5 border rounded-full text-sm font-bold cursor-pointer transition-colors " + (selectedCategory === sys ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 hover:border-emerald-400")}
                      >{sys}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLoading ? <div className="py-20 text-slate-400 font-bold flex flex-col items-center gap-4"><Loader2 className="animate-spin" size={40}/> 正在連線資料庫...</div> : searchResults.length > 0 && (
              <div className="max-w-5xl mx-auto p-8 fade-in">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <div className="text-xl font-bold text-slate-800">顯示 <strong>{currentLabel}</strong>，共 {searchResults.length} 筆</div>
                  <span className="bg-slate-200 px-3 py-1 rounded-full text-sm font-bold text-slate-500">資料庫: 2024.11</span>
                </div>
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm border-b"><tr><th className="p-5 w-32 text-center">藥碼</th><th className="p-5">藥物名稱</th><th className="p-5 text-right">狀態</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchResults.map((drug, i) => {
                        const hasReaction = drug.adverse_reaction && String(drug.adverse_reaction).toLowerCase() !== 'nan';
                        return (
                          <tr key={i} className={"cursor-pointer hover:bg-blue-50 transition-colors " + (!hasReaction ? "bg-slate-50/50" : "bg-white")} onClick={() => { setSelectedDrug(drug); setView('drug_detail'); }}>
                            <td className="p-5 font-mono text-slate-500 font-bold text-center">{drug.id || "-"}</td>
                            <td className="p-5"><div className="font-black text-[#0f4c81] text-lg">{drug.name}</div></td>
                            <td className="p-5 text-right">
                              {hasReaction ? <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black border border-rose-200 shadow-sm"><AlertTriangle size={12} className="inline mr-1"/>注意不良反應</span> : <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black border border-amber-200 shadow-sm"><ClipboardCheck size={12} className="inline mr-1"/>人工待確認</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 藥物詳情獨立頁 (整頁列印) */}
        {view === 'drug_detail' && selectedDrug && (
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative print:block print:h-auto print:bg-white print-force-show">
            <div className="sticky top-0 left-0 right-0 bg-white shadow-sm z-50 border-b-4 border-[#0f4c81] p-6 px-12 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-6">
                <button onClick={() => setView('repository')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all"><ChevronLeft size={18}/> 返回查詢</button>
                <h1 className="text-3xl font-black text-[#0f4c81] tracking-tight m-0">{selectedDrug.name}</h1>
              </div>
              <div className="flex gap-3">
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-100 bg-blue-50 text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white rounded-full font-bold transition-colors"><Copy size={18}/> 複製內容</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-colors"><Printer size={18}/> 列印</button>
              </div>
            </div>

            {showCopyToast && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[200] flex items-center gap-2 fade-in print:hidden">
                <ClipboardCheck size={20} className="text-green-400"/> 已複製到剪貼簿
              </div>
            )}

            <div className="max-w-6xl mx-auto p-12 print:p-0 print:m-0 print:max-w-none print:w-full">
              <h1 className="hidden print:block text-4xl font-black text-black mb-8 border-b-2 pb-4">{selectedDrug.name} - 藥物詳情</h1>
              {selectedDrug.adverse_reaction && String(selectedDrug.adverse_reaction).toLowerCase() !== 'nan' ? (
                <div className="bg-white rounded-2xl p-10 mb-8 shadow-sm border-l-[6px] border-[#dc3545] print:shadow-none print:border-black print:p-2">
                  <div className="text-2xl font-black text-rose-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black"><AlertTriangle size={28}/> 不良反應 (Adverse Reactions)</div>
                  <div dangerouslySetInnerHTML={{ __html: formatAndReplaceText(selectedDrug.adverse_reaction) }} />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-16 mb-8 shadow-sm text-center border print:shadow-none print:border-black print:p-2">
                  <ShieldCheck size={64} className="text-emerald-500 mx-auto mb-4 print:text-black"/>
                  <p className="text-xl font-bold text-slate-500 print:text-black">此藥物目前無不良反應記載</p>
                </div>
              )}
              {selectedDrug.exception_handling && String(selectedDrug.exception_handling).toLowerCase() !== 'nan' && (
                <div className="bg-white rounded-2xl p-10 mb-8 shadow-sm border-l-[6px] border-[#0d6efd] print:shadow-none print:border-black print:p-2">
                  <div className="text-2xl font-black text-blue-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black"><AlertCircle size={28}/> 例外處理與注意事項</div>
                  <div dangerouslySetInnerHTML={{ __html: formatAndReplaceText(selectedDrug.exception_handling) }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}