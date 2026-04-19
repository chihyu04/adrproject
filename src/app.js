import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { Users, Pill, Activity, ArrowLeft, AlertCircle, Calendar, ChevronDown, Search, X, Database, AlertTriangle, HeartPulse, Shuffle, Building2, Loader2, ClipboardCheck, Printer, Copy, ShieldCheck, ChevronLeft } from 'lucide-react';
import './index.css';

// ==========================================
// 1. 靜態數據庫與字典 (加入多組病歷動態資料)
// ==========================================
const admissionHistory = [
  { id: 'ADM-001', date: '2026/09/10 - 09/30 (本次住院)' }, 
  { id: 'ADM-002', date: '2025/11/12 - 11/28 (過往住院)' }
];

// 動態資料庫：根據不同的 ADM-ID 給予不同的圖表與用藥資料
const mockDashboardData = {
  'ADM-001': {
    fullData: Array.from({ length: 21 }, (_, i) => ({ date: '09/' + (10 + i), na: 142 - (i * 0.8) + Math.sin(i), k: 3.6 + (i * 0.12), index: i })),
    medData: [
      { name: 'FUROSEMIDE (LASIX)', type: 'Na+ Impact', startIdx: 0, endIdx: 15, color: '#3B82F6', impact: '138 -> 128', level: '高度相關' },
      { name: 'LISINOPRIL', type: 'K+ Impact', startIdx: 5, endIdx: 12, color: '#EF4444', impact: '3.5 -> 5.5', level: '中度相關' },
      { name: 'ASPIRIN', type: 'Anti-platelet', startIdx: 0, endIdx: 21, color: '#94A3B8', impact: 'N/A', level: '無明顯相關' },
      { name: 'SPIRONOLACTONE', type: 'K+ Impact', startIdx: 2, endIdx: 18, color: '#94A3B8', impact: '3.6 -> 4.8', level: '無明顯相關' },
      { name: 'KCL', type: 'K+ Impact', startIdx: 8, endIdx: 20, color: '#64748B', impact: '3.8 -> 4.6', level: '預期內治療反應' }
    ],
    medicationLogs: [
      { name: 'FUROSEMIDE (LASIX)', start: '09/10 08:00', end: '09/25 10:00', dose: ['40 mg IV q12h', '20 mg IV q12h (09/18 減量)'], status: 'PAST' },
      { name: 'LISINOPRIL', start: '09/12 09:00', end: '09/18 10:00', dose: ['5 mg PO QD'], status: 'PAST' },
      { name: 'SPIRONOLACTONE', start: '09/15 08:00', end: '使用中', dose: ['25 mg PO QD'], status: 'ACTIVE' },
      { name: 'ASPIRIN', start: '09/10 08:00', end: '使用中', dose: ['100 mg PO QD'], status: 'ACTIVE' }
    ]
  },
  'ADM-002': {
    fullData: Array.from({ length: 17 }, (_, i) => ({ date: '11/' + (12 + i), na: 136 + Math.sin(i)*2, k: 4.0 + Math.cos(i)*0.4, index: i })),
    medData: [
      { name: 'AMLODIPINE', type: 'BP Impact', startIdx: 0, endIdx: 16, color: '#10B981', impact: '150 -> 120', level: '預期內治療反應' },
      { name: 'IBUPROFEN', type: 'Renal Impact', startIdx: 3, endIdx: 10, color: '#F59E0B', impact: '1.0 -> 1.5', level: '中度相關' }
    ],
    medicationLogs: [
      { name: 'AMLODIPINE', start: '11/12 08:00', end: '11/28 12:00', dose: ['5 mg PO QD'], status: 'PAST' },
      { name: 'IBUPROFEN', start: '11/15 08:00', end: '11/22 08:00', dose: ['400 mg PO TID'], status: 'PAST' }
    ]
  }
};

const mockPatients = [
  {id:'P001', name:'王小明', info:'(男/68)', na:'128', k:'4.5', room:'802-1', status:'危急'}, 
  {id:'P002', name:'李大同', info:'(男/72)', na:'138', k:'4.2', room:'805-2', status:'觀察中'}
];

const categories = [
    "Cardiovascular", "Dermatologic", "Endocrine & metabolic", "Gastrointestinal", "Genitourinary", 
    "Hematologic & oncologic", "Hepatic", "Local", "Nervous system", "Neuromuscular & skeletal",
    "Respiratory", "Otic", "Renal", "Hypersensitivity", "Immunologic", "Psychiatric", "Musculoskeletal", 
    "Ophthalmic", "Miscellaneous"
];

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

// ==========================================
// 2. 主程式 (App) 與狀態管理
// ==========================================
export default function App() {
  const [view, setView] = useState('overview'); 
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // 儀表板與病歷狀態
  const [currentAdm, setCurrentAdm] = useState(admissionHistory[0]);
  const [isAdmMenuOpen, setIsAdmMenuOpen] = useState(false);
  const [windowSize, setWindowSize] = useState(7);
  const [startIndex, setStartIndex] = useState(0);

  // 取得目前選中病歷的專屬資料
  const currentDashboardData = mockDashboardData[currentAdm.id];
  const visibleData = useMemo(() => currentDashboardData.fullData.slice(startIndex, startIndex + windowSize), [startIndex, windowSize, currentDashboardData]);

  // 藥物查詢狀態
  const [allDrugs, setAllDrugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('所有藥物列表');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, with_reactions: 0 });
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 獨立詳情頁狀態
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // 載入本地 JSON 資料
  useEffect(() => {
    fetch('/drug_adverse.json')
      .then(res => { if (!res.ok) throw new Error('找不到 json'); return res.json(); })
      .then(data => {
        const normalizedData = data.map(item => ({
           id: item.id || item['drug id'],
           name: item.name,
           adverse_reaction: item['adverse reaction'] || item.adverse_reaction || '',
           exception_handling: item['exception handling'] || item.exception_handling || ''
        }));
        setAllDrugs(normalizedData);
        const total = normalizedData.length;
        const with_reactions = normalizedData.filter(d => d.adverse_reaction && String(d.adverse_reaction).toLowerCase() !== 'nan').length;
        setStats({ total, with_reactions });
      })
      .catch(err => console.error(err));
  }, []);

  const performSearch = (params, labelText) => {
    setIsLoading(true); setHasResults(true); setCurrentLabel(labelText);
    setTimeout(() => {
      let results = [...allDrugs];
      if (params.filter === 'reactions') {
        results = results.filter(d => d.adverse_reaction && String(d.adverse_reaction).toLowerCase() !== 'nan');
      }
      if (params.category) {
        const catLower = params.category.toLowerCase();
        results = results.filter(d => d.adverse_reaction && String(d.adverse_reaction).toLowerCase().includes(catLower));
      }
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        results = results.filter(d => (d.name && d.name.toLowerCase().includes(kw)) || (d.id && String(d.id).toLowerCase().includes(kw)));
      }
      setSearchResults(results.slice(0, 1000)); 
      setIsLoading(false);
    }, 200);
  };

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
    const cleanText = (htmlStr) => {
        const temp = document.createElement('div');
        temp.innerHTML = formatAndReplaceText(htmlStr);
        return temp.innerText.trim();
    };
    let textToCopy = `【藥物名稱】${selectedDrug.name}\n\n`;
    if (selectedDrug.adverse_reaction && String(selectedDrug.adverse_reaction).toLowerCase() !== 'nan') {
        textToCopy += `【不良反應】\n${cleanText(selectedDrug.adverse_reaction)}\n\n`;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

  // ==========================================
  // 模組化介面：側邊欄 (Sidebar)
  // ==========================================
  const renderSidebar = () => (
    <div className="w-64 bg-white border-r p-6 flex flex-col shadow-sm z-10 print:hidden">
      <div className="flex items-center gap-2 text-blue-600 font-bold mb-10 text-xl italic"><Activity /> ADR PRO</div>
      <button 
        onClick={() => setView('overview')} 
        className={"flex items-center gap-3 p-4 rounded-2xl font-bold w-full mb-4 transition-all " + (view === 'overview' || view === 'dashboard' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
      >
        <Users size={18} /> 病人總覽
      </button>
      <button 
        onClick={() => { setView('repository'); setHasResults(false); setSearchQuery(''); setSelectedCategory(''); setSearchResults([]); setShowCategories(false); }} 
        className={"flex items-center gap-3 p-4 rounded-2xl font-bold w-full transition-all " + (view === 'repository' || view === 'drug_detail' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
      >
        <Pill size={18} /> 藥物查詢
      </button>
    </div>
  );

  // ==========================================
  // 模組化介面：藥物查詢 (Repository View)
  // ==========================================
  const renderRepository = () => (
    <div className="flex-1 overflow-y-auto relative bg-[#f8fafc] print-force-show print:hidden">
      {allDrugs.length === 0 && (
         <div className="bg-amber-100 text-amber-800 p-4 text-center font-bold sticky top-0 z-[100]">⚠️ 請確認 drug_adverse.json 位於 public 資料夾中。</div>
      )}
      <div className={"w-full flex flex-col items-center transition-all duration-500 ease-in-out " + (hasResults ? "pt-8 pb-6 border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm" : "pt-[20vh]")}>
        <div className={"text-center transition-all duration-500 " + (hasResults ? "mb-4 flex items-center gap-3" : "mb-8")}>
          <h1 className={"font-bold text-[#0f4c81] flex items-center justify-center gap-2 " + (hasResults ? "text-2xl" : "text-4xl")}><Building2 size={hasResults ? 28 : 40} /> 台北榮總藥物查詢</h1>
          {!hasResults && <p className="text-slate-500 text-lg mt-3 font-bold tracking-widest">臨床醫師專用搜尋引擎</p>}
        </div>

        <div className="w-full max-w-2xl px-6">
          <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-3 shadow-lg">
            <Search className="text-slate-400 mr-3 cursor-pointer" size={22} onClick={() => { if(searchQuery.trim()) { setSelectedCategory(''); performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery); } }} />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setSelectedCategory(''); performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery); } }}
              className="flex-1 outline-none text-xl text-slate-800 bg-transparent" placeholder="輸入藥名或代碼..."
            />
            {searchQuery && <X className="text-slate-400 cursor-pointer ml-3" size={24} onClick={() => { setSearchQuery(''); setHasResults(false); setSearchResults([]); }} />}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8 px-6 font-bold text-sm">
          <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); performSearch({ keyword: '' }, '完整收錄藥物'); }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#0f4c81] text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white bg-white shadow-sm transition-colors">
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
                  className={"px-4 py-1.5 border rounded-full text-sm font-bold cursor-pointer " + (selectedCategory === sys ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 hover:border-emerald-400")}
                >{sys}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasResults && (
        <div className="max-w-5xl mx-auto p-8">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div className="text-xl font-bold text-slate-800">顯示 <strong>{currentLabel}</strong>，共 {searchResults.length} 筆</div>
            <span className="bg-slate-200 px-3 py-1 rounded-full text-sm font-bold text-slate-500">資料庫: 2024.11</span>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Loader2 className="animate-spin mb-4" size={40} />搜尋中...</div>
          ) : searchResults.length > 0 ? (
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
          ) : (<div className="text-center py-20 text-slate-400 font-bold text-xl">找不到符合的結果</div>)}
        </div>
      )}
    </div>
  );

  // ==========================================
  // ★ 獨立的藥物詳細資料頁面 (列印優化版)
  // ==========================================
  const renderDrugDetail = () => {
    if (!selectedDrug) return null;
    const hasReaction = selectedDrug.adverse_reaction && String(selectedDrug.adverse_reaction).toLowerCase() !== 'nan';
    const hasException = selectedDrug.exception_handling && String(selectedDrug.exception_handling).toLowerCase() !== 'nan';

    return (
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative print-force-show">
        <div className="sticky top-0 left-0 right-0 bg-white shadow-sm z-50 border-b-4 border-[#0f4c81] p-6 px-12 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('repository')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all">
              <ChevronLeft size={18}/> 返回查詢
            </button>
            <h1 className="text-3xl font-black text-[#0f4c81] tracking-tight m-0">{selectedDrug.name}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-100 bg-blue-50 text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white rounded-full font-bold transition-colors">
              <Copy size={18}/> 複製內容
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-colors">
              <Printer size={18}/> 列印
            </button>
          </div>
        </div>

        {showCopyToast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[200] flex items-center gap-2 fade-in print:hidden">
            <ClipboardCheck size={20} className="text-green-400"/> 已複製到剪貼簿
          </div>
        )}

        <div className="max-w-6xl mx-auto p-12 print:p-0 print:m-0 print:max-w-none print:w-full">
          <h1 className="hidden print:block text-4xl font-black text-black mb-8 border-b-2 pb-4">{selectedDrug.name} - 藥物詳情</h1>

          {hasReaction ? (
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

          {hasException && (
            <div className="bg-white rounded-2xl p-10 mb-8 shadow-sm border-l-[6px] border-[#0d6efd] print:shadow-none print:border-black print:p-2">
              <div className="text-2xl font-black text-blue-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black"><AlertCircle size={28}/> 例外處理與注意事項</div>
              <div dangerouslySetInnerHTML={{ __html: formatAndReplaceText(selectedDrug.exception_handling) }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // 5. 模組化介面：圖表儀表板 (Dashboard View)
  // ==========================================
  const renderDashboard = () => (
    <div className="flex-1 overflow-y-auto p-8 print-force-show print:hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4 relative">
          <button onClick={() => setView('overview')} className="p-3 bg-white border rounded-xl hover:text-blue-600 shadow-sm"><ArrowLeft size={18} /></button>
          
          <button onClick={() => setIsAdmMenuOpen(!isAdmMenuOpen)} className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-sm font-bold text-slate-700 text-sm italic hover:bg-slate-50 transition-colors">
            <Calendar size={16} className="text-blue-500"/>{currentAdm.date}<ChevronDown size={14} className="text-slate-300" />
          </button>
          
          {isAdmMenuOpen && (
            <div className="absolute top-14 left-14 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {admissionHistory.map(adm => (
                <div key={adm.id} onClick={() => { setCurrentAdm(adm); setStartIndex(0); setIsAdmMenuOpen(false); }} className="px-6 py-4 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-600 border-b last:border-b-0 transition-colors">
                  {adm.date}
                </div>
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
        <div className="h-72 w-full mb-6">
          <ResponsiveContainer>
            <LineChart data={visibleData} margin={{ left: 10, right: 10 }}>
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
          <input type="range" min="0" max={Math.max(0, currentDashboardData.fullData.length - windowSize)} value={startIndex} onChange={(e) => setStartIndex(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
        <div className="space-y-4 pt-10 border-t border-slate-100">
          {currentDashboardData.medData.map((med, i) => {
            const left = Math.max(0, ((med.startIdx - startIndex) / windowSize) * 100);
            const right = Math.min(100, ((med.endIdx - startIndex + 1) / windowSize) * 100);
            const width = Math.max(0, right - left);
            return (
              <div key={i} className="flex items-center">
                <div className="w-48 text-left pr-4"><p className="text-[11px] font-black text-slate-700 italic">{med.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{med.type}</p></div>
                <div className="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 shadow-inner">
                  {width > 0 && <div className="absolute h-full opacity-80 rounded-lg shadow-sm flex items-center px-4" style={{ left: left + '%', width: width + '%', backgroundColor: med.color }}><span className="text-[8px] text-white font-black uppercase opacity-75">USAGE</span></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border p-10 mb-8 text-left">
         <div className="flex items-center gap-2 mb-8 font-black text-slate-700 italic border-l-4 border-blue-600 pl-4 uppercase">實際用藥全紀錄 (住院詳細明細)</div>
         <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b"><tr><th className="pb-4">藥物名稱</th><th className="pb-4">開始給藥</th><th className="pb-4">停止給藥</th><th className="pb-4 text-center">劑量變動歷程</th><th className="pb-4 text-right">狀態</th></tr></thead>
            <tbody className="divide-y">
              {currentDashboardData.medicationLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-all">
                  <td className="py-6 font-black italic text-slate-700 uppercase">{log.name}</td>
                  <td className="py-6 text-slate-400 font-mono">{log.start}</td>
                  <td className="py-6 text-slate-400 font-mono">{log.end}</td>
                  <td className="py-6 font-bold text-slate-600 text-center">{log.dose.map((d, di) => <div key={di} className="flex items-center justify-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{d}</div>)}</td>
                  <td className="py-6 text-right"><span className={log.status === 'ACTIVE' ? "text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full font-bold" : "text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-bold"}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-12 text-left">
        <div className="bg-rose-50/50 p-8 border-b flex items-center gap-3"><AlertCircle className="text-rose-500" size={24} /><h2 className="text-rose-900 font-black italic text-xl uppercase">ADR 關聯分析結果</h2></div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase"><tr><th className="p-8">臨床肇因藥物</th><th className="p-8">影響維度</th><th className="p-8 text-center">檢驗值變化</th><th className="p-8 text-right">智慧判定結論</th></tr></thead>
          <tbody className="divide-y">
            {currentDashboardData.medData.map((med, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-all">
                <td className="p-8 font-black text-slate-700 italic">{med.name} {med.level.includes('高') && <span className="bg-rose-100 text-rose-500 text-[8px] px-2 py-0.5 rounded font-black ml-2 uppercase">Critical</span>}</td>
                <td className="p-8 text-slate-400 font-bold uppercase">{med.type}</td>
                <td className="p-8 font-mono font-black text-2xl italic text-center text-rose-500">{med.impact}</td>
                <td className="p-8 text-right"><span className="px-10 py-4 rounded-3xl text-xs font-black uppercase text-white shadow-xl" style={{ backgroundColor: med.level.includes('高') ? '#F43F5E' : med.level.includes('中') ? '#F97316' : '#94A3B8' }}>{med.level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // 6. 模組化介面：首頁病人清單 (Overview View)
  // ==========================================
  const renderOverview = () => (
    <div className="flex-1 p-12 overflow-y-auto print-force-show print:hidden">
      <h1 className="text-2xl font-black italic text-slate-800 mb-8 border-b-[3px] border-blue-600 inline-block pb-1 uppercase">患者住院紀錄</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-6xl">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            <tr><th className="py-6 px-8">病歷 ID</th><th className="py-6 px-8">病患</th><th className="py-6 px-8 text-center">目前房號</th><th className="py-6 px-8 text-center">最新 Na+ / K+</th><th className="py-6 px-8 text-right pr-12">監測狀態</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {mockPatients.map(p => (
              <tr key={p.id} onClick={() => { setSelectedPatient(p); setView('dashboard'); }} className="hover:bg-slate-50 transition-all cursor-pointer group">
                <td className="py-6 px-8 font-black text-blue-600 text-sm">{p.id}</td>
                <td className="py-6 px-8 text-slate-700 font-bold text-sm">{p.name} <span className="text-slate-400 font-normal ml-1">{p.info}</span></td>
                <td className="py-6 px-8 text-slate-500 font-medium text-sm text-center">{p.room}</td>
                <td className="py-6 px-8 font-sans font-bold text-base text-center">
                  <span className={p.status === '危急' ? "text-rose-500 underline decoration-rose-500 underline-offset-4" : "text-slate-700"}>{p.na}</span> <span className="text-slate-400 mx-1">/</span> <span className="text-slate-700">{p.k}</span>
                </td>
                <td className="py-6 px-8 text-right pr-12">
                  <span className={p.status === '危急' ? "bg-rose-100 text-rose-500 px-4 py-1.5 rounded-full text-[11px] font-bold" : "bg-[#FEF3C7] text-[#D97706] px-4 py-1.5 rounded-full text-[11px] font-bold"}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // 7. 最終畫面渲染邏輯 (結合強制的 Print CSS)
  // ==========================================
  return (
    <>
      <style>
        {`
          @media print {
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0 !important; padding: 0 !important; }
            .print-force-show { display: block !important; height: auto !important; overflow: visible !important; position: relative !important; }
            ::-webkit-scrollbar { display: none; }
          }
        `}
      </style>
      <div className="flex h-screen bg-[#F8FAFC] font-sans text-left print-force-show">
        {renderSidebar()}
        {view === 'overview' && renderOverview()}
        {view === 'dashboard' && renderDashboard()}
        {view === 'repository' && renderRepository()}
        {view === 'drug_detail' && renderDrugDetail()}
      </div>
    </>
  );
}