import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { ArrowLeft, Calendar, ChevronDown, AlertCircle, Search, Users, Activity, Building2, Database, AlertTriangle, HeartPulse, X, ChevronLeft, Copy, ClipboardCheck, Printer, Lock, User } from 'lucide-react';

const API_BASE = "http://127.0.0.1:5000/api";

const LAB_DICTIONARY = [
    { term: "increased serum alanine aminotransferase", label: "ALT", type: "up" },
    { term: "decreased serum alanine aminotransferase", label: "ALT", type: "down" },
    { term: "increased serum aspartate aminotransferase", label: "AST", type: "up" },
    { term: "decreased serum aspartate aminotransferase", label: "AST", type: "down" },
    { term: "increased serum alkaline phosphatase", label: "ALKP", type: "up" },
    { term: "decreased serum alkaline phosphatase", label: "ALKP", type: "down" },
    { term: "Increased gamma-glutamyl transferase", label: "GGT", type: "up" },
    { term: "decreased gamma-glutamyl transferase", label: "GGT", type: "down" },
    { term: "Increased blood urea nitrogen", label: "BUN", type: "up" },
    { term: "decreased blood urea nitrogen", label: "BUN", type: "down" },
    { term: "Increased serum creatinine", label: "SCr", type: "up" },
    { term: "decreased serum creatinine", label: "SCr", type: "down" },
    { term: "increased serum sodium", label: "Na", type: "up" },
    { term: "decreased serum sodium", label: "Na", type: "down" },
    { term: "increased serum potassium", label: "K", type: "up" },
    { term: "decreased serum potassium", label: "K", type: "down" }
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 🔥 新增：儲存目前登入的使用者資訊
  const [currentUser, setCurrentUser] = useState(null);
  
  const [view, setView] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [stats, setStats] = useState({ total: 0, with_reactions: 0 });
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  const categories = ["Cardiovascular", "Dermatologic", "Endocrine & metabolic", "Gastrointestinal", "Genitourinary", "Hematologic & oncologic", "Hepatic", "Local", "Nervous system", "Neuromuscular & skeletal", "Respiratory", "Otic", "Renal", "Hypersensitivity", "Immunologic", "Psychiatric", "Musculoskeletal", "Ophthalmic", "Miscellaneous"];

  const [startIndex, setStartIndex] = useState(0);
  const [windowSize, setWindowSize] = useState(7);
  const [isAdmMenuOpen, setIsAdmMenuOpen] = useState(false);
  const [admissions, setAdmissions] = useState([]);
  const [currentAdm, setCurrentAdm] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API_BASE}/patients`).then(res => res.json()).then(json => { if (json.status === "success") setPatients(json.data); }).finally(() => setIsLoading(false));
      fetch(`${API_BASE}/stats`).then(res => res.json()).then(setStats).catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    // 🔥 捕捉使用者輸入的帳號，並賦予對應的身分
    const formData = new FormData(e.target);
    const username = formData.get('username') || 'Unknown';
    const role = username.toLowerCase().includes('doctor') ? '醫師' : '藥師';
    
    setCurrentUser({ name: username, role: role });
    setIsLoggedIn(true);
  };

  const performSearch = (params, label) => {
    setIsLoading(true); setCurrentLabel(label);
    fetch(`${API_BASE}/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) })
    .then(res => res.json()).then(json => { if (json.status === "success") setSearchResults(json.data); })
    .catch(err => { console.error("搜尋出錯:", err); alert("無法連線後端 API"); })
    .finally(() => setIsLoading(false));
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    if (p.admissions && p.admissions.length > 0) {
      setAdmissions(p.admissions); setCurrentAdm(p.admissions[0]); setClinicalData(p.admissions[0].clinicalData);
    }
    setStartIndex(0); setView('dashboard');
  };

  const formatAndReplaceText = (text) => {
    if (!text || String(text).toLowerCase() === 'nan') return '<span class="text-slate-400 font-bold">無相關資料記載</span>';

    let processed = String(text)
        .replace(/^Adverse Reactions\s*/i, '')
        .replace(/\(Ref\s*\)/gi, '')
        .replace(/:?style="[^"]*"\s*class="[^"]*">/gi, '') 
        .replace(/style=.*?>/gi, '')
        .replace(/<[^>]*>/g, '') 
        .replace(/\[\s*link to .*?\]/gi, '');

    LAB_DICTIONARY.forEach(item => {
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapeRegExp(item.term), 'gi');
        const colorClass = item.type === 'up' ? 'text-rose-700 bg-rose-100 border-rose-200' : 'text-blue-700 bg-blue-100 border-blue-200';
        const icon = item.type === 'up' ? '⬆' : '⬇';
        const replacement = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded border font-black text-xs shadow-sm mx-1 align-text-bottom print-color-exact ${colorClass}">${item.label} ${icon}</span>`;
        processed = processed.replace(regex, replacement);
    });

    const sections = ["Frequency not defined", "Postmarketing and/or case reports", "Postmarketing", ">10%", "1% to 10%", "<1%", "≥10%"];
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const secPattern = new RegExp(`(${sections.map(escapeRegExp).join('|')}):?`, 'gi');
    processed = processed.replace(secPattern, `<div class="mt-8 mb-3 p-3 bg-slate-50 border-l-4 border-blue-500 font-black text-slate-800 rounded-r shadow-sm text-lg print-color-exact">$1</div>`);

    const catPattern = new RegExp(`(${categories.map(escapeRegExp).join('|')}):`, 'gi');
    processed = processed.replace(catPattern, `<br><strong class="text-amber-900 bg-amber-100 px-2 py-1 rounded shadow-sm font-black mr-2 mt-3 mb-1 inline-block text-sm print-color-exact">$1:</strong>`);

    if (processed.startsWith('<br>')) processed = processed.replace(/^(<br>)+/, '');
    return `<div class="text-slate-700 leading-loose text-[16px] print-text-main break-words whitespace-pre-wrap">${processed}</div>`;
  };

  const copyToClipboard = () => {
    if (!selectedDrug) return;
    let textToCopy = `【藥物名稱】${selectedDrug.name}\n\n`;
    const rawAdverse = selectedDrug['adverse reaction'] || selectedDrug.adverse_reaction;
    const rawException = selectedDrug['exception handling'] || selectedDrug.exception_handling;

    const convertHtmlToText = (htmlStr) => {
        const formattedHtml = formatAndReplaceText(htmlStr);
        const temp = document.createElement('div');
        temp.innerHTML = formattedHtml;
        const sections = temp.querySelectorAll('.border-l-4');
        sections.forEach(sec => { sec.prepend('\n\n['); sec.append(']\n'); });
        const strongs = temp.querySelectorAll('strong');
        strongs.forEach(s => { s.prepend('\n'); });
        const badges = temp.querySelectorAll('.inline-flex');
        badges.forEach(b => { b.innerHTML = ` [${b.innerText}] `; });
        return temp.innerText.trim();
    };

    if (rawAdverse && String(rawAdverse).toLowerCase() !== 'nan') textToCopy += `【不良反應】\n${convertHtmlToText(rawAdverse)}\n\n`;
    if (rawException && String(rawException).toLowerCase() !== 'nan') textToCopy += `【例外處理】\n${convertHtmlToText(rawException)}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        setShowCopyToast(true); setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-rose-100 rounded-full blur-3xl opacity-50"></div>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-12 relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
              <Activity size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center tracking-tight leading-snug">
              台北榮總<br/>藥物不良反應偵測系統
            </h1>
            <p className="text-slate-400 font-bold mt-3 tracking-widest text-sm uppercase">ADR Pro System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm ml-1">員工代號 / 帳號</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                {/* 🔥 加上 name="username" 讓表單可以捕捉內容 */}
                <input 
                  type="text" 
                  name="username"
                  placeholder="請輸入帳號" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm ml-1">登入密碼</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  name="password"
                  placeholder="請輸入密碼" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white rounded-xl py-4 font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all mt-4"
            >
              登 入 系 統
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderSidebar = () => (
    <div className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 print:hidden">
      <div className="flex items-center gap-3 mb-12 px-2">
        <Activity size={32} className="text-blue-600" />
        <span className="text-2xl font-black italic text-slate-800">ADR <span className="text-blue-600">PRO</span></span>
      </div>
      <nav className="flex-1 space-y-2">
        <button onClick={() => setView('overview')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === 'overview' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><Users size={20} /> 患者住院紀錄</button>
        <button onClick={() => { setView('repository'); setSearchResults([]); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === 'repository' || view === 'drug_detail' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><Search size={20} /> 藥物查詢</button>
      </nav>
      
      {/* 🔥 新增：側邊欄底部的使用者身分卡片與登出區塊 */}
      <div className="mt-auto border-t border-slate-100 pt-8 pb-2">
        <div className="flex items-center gap-4 px-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-black text-slate-700 truncate">{currentUser?.name}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{currentUser?.role}</p>
          </div>
        </div>
        <button 
          onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} 
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
        >
          登出系統
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if(!clinicalData || !currentAdm) return <div className="flex-1 flex items-center justify-center font-bold text-slate-400">載入中...</div>;
    const visibleTrends = clinicalData.trends.slice(startIndex, startIndex + windowSize);
    
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div className="flex items-center gap-4 relative">
            <button onClick={() => setView('overview')} className="p-3 bg-white border rounded-xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={18} /></button>
            <button onClick={() => setIsAdmMenuOpen(!isAdmMenuOpen)} className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <Calendar size={16} className="text-blue-500"/> {currentAdm.date} <ChevronDown size={14} className={isAdmMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {isAdmMenuOpen && (
              <div className="absolute top-14 left-14 mt-2 w-72 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                {admissions.map(adm => (
                  <div key={adm.id} onClick={() => { setCurrentAdm(adm); setClinicalData(adm.clinicalData); setStartIndex(0); setIsAdmMenuOpen(false); }} className="px-6 py-4 hover:bg-blue-50 cursor-pointer font-bold border-b last:border-b-0 text-slate-600">{adm.date}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {[3, 7, 14].map(d => (
              <button key={d} onClick={() => { setWindowSize(d); setStartIndex(0); }} className={windowSize === d ? "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs" : "px-6 py-2 bg-white text-slate-400 border font-bold text-xs shadow-sm"}>{d}D</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-8 print:shadow-none print:border-black print:p-0">
          <div className="h-80 w-full mb-6">
            <ResponsiveContainer>
              <LineChart data={visibleTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis yAxisId="na" domain={[120, 160]} axisLine={false} tickLine={false} tick={{fill: '#F97316', fontSize: 10, fontWeight: 'bold'}} width={40} />
                <YAxis yAxisId="k" orientation="right" domain={[2, 8]} axisLine={false} tickLine={false} tick={{fill: '#6366F1', fontSize: 10, fontWeight: 'bold'}} width={40} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                
                <ReferenceArea yAxisId="na" y1={135} y2={145} fill="#F97316" fillOpacity={0.05} stroke="none">
                  <Label value="Na 正常區間 (135-145)" position="insideTopLeft" fill="#F97316" fontSize={11} fontWeight="bold" opacity={0.6} />
                </ReferenceArea>
                <ReferenceArea yAxisId="k" y1={3.5} y2={5.0} fill="#6366F1" fillOpacity={0.05} stroke="none">
                  <Label value="K 正常區間 (3.5-5.0)" position="insideBottomRight" fill="#6366F1" fontSize={11} fontWeight="bold" opacity={0.6} />
                </ReferenceArea>

                <Line yAxisId="na" type="monotone" dataKey="na" stroke="#F97316" strokeWidth={5} dot={{r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 3}} />
                <Line yAxisId="k" type="monotone" dataKey="k" stroke="#6366F1" strokeWidth={5} dot={{r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <input type="range" min="0" max={Math.max(0, clinicalData.trends.length - windowSize)} step="1" value={startIndex} onChange={(e) => setStartIndex(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8 transition-all print:hidden" />
          
          <div className="space-y-4 pt-10 border-t border-slate-100">
            {clinicalData.gantt && clinicalData.gantt.map((med, i) => {
              const left = Math.max(0, ((med.startIdx - startIndex) / windowSize) * 100);
              const right = Math.min(100, ((med.endIdx - startIndex + 1) / windowSize) * 100);
              const width = Math.max(0, right - left);
              return (
                <div key={i} className="flex items-center">
                  <div className="w-48 text-left pr-4">
                    <p className="text-[11px] font-black text-slate-700 italic uppercase">{med.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{med.type}</p>
                  </div>
                  <div className="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 shadow-inner">
                    {width > 0 && <div className="absolute h-full opacity-80 rounded-lg flex items-center px-4 transition-all" style={{ left: left + '%', width: width + '%', backgroundColor: med.color }}>
                      <span className="text-[8px] text-white font-black whitespace-nowrap">{med.startDate} - {med.endDate}</span>
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-8 text-left print:shadow-none print:border-black print:p-0">
           <h2 className="font-black text-slate-700 mb-8 border-l-4 border-blue-600 pl-4 italic uppercase tracking-tighter">實際用藥全紀錄</h2>
           <table className="w-full text-sm">
              <thead className="text-slate-400 border-b text-left"><tr><th className="pb-4">藥物名稱</th><th className="pb-4">開始時間</th><th className="pb-4">停止時間</th><th className="pb-4 text-right">狀態</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {clinicalData.logs && clinicalData.logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all">
                    <td className="py-6 font-black italic text-slate-700">{log.name}</td>
                    <td className="py-6 text-slate-400 font-mono">{log.start}</td>
                    <td className="py-6 text-slate-400 font-mono">{log.end}</td>
                    <td className="py-6 text-right"><span className={log.status === 'ACTIVE' ? "text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full font-bold" : "text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-bold"}>{log.status}</span></td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-12 text-left print:shadow-none print:border-black print:p-0">
          <div className="bg-rose-50/50 p-6 -m-10 mb-10 rounded-t-3xl border-b border-rose-100 flex items-center gap-3 print:m-0 print:rounded-none">
            <AlertCircle className="text-rose-500"/><h2 className="text-rose-900 font-black italic text-xl uppercase tracking-tighter">ADR 關聯分析結論</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr><th className="p-8 text-left">臨床肇因藥物</th><th className="p-8 text-left">影響維度</th><th className="p-8 text-center">檢驗值變化</th><th className="p-8 text-right">智慧判定結果</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clinicalData.gantt && clinicalData.gantt.map((med, i) => (
                <tr key={i} className="hover:bg-rose-50/30 transition-all">
                  <td className="p-8 font-black text-slate-700 italic">{med.name} {med.level && med.level.includes('高') && <span className="bg-rose-100 text-rose-500 text-[8px] px-2 py-0.5 rounded font-black ml-2 uppercase italic">Critical</span>}</td>
                  <td className="p-8 text-slate-400 font-bold uppercase">{med.type}</td>
                  <td className="p-8 font-mono font-black text-2xl italic text-center text-rose-500">{med.impact}</td>
                  <td className="p-8 text-right">
                    <span className="px-10 py-4 rounded-3xl text-xs font-black uppercase text-white shadow-xl inline-block print-color-exact" style={{ backgroundColor: med.level && med.level.includes('高') ? '#F43F5E' : med.level && med.level.includes('中') ? '#F97316' : '#10B981' }}>{med.level}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRepository = () => (
    <div className="flex-1 overflow-y-auto relative bg-[#f8fafc]">
      <div className={"w-full flex flex-col items-center transition-all " + (searchResults.length > 0 ? "pt-8 pb-6 border-b bg-white sticky top-0 z-50 shadow-sm" : "pt-[20vh]")}>
        <div className={"text-center transition-all " + (searchResults.length > 0 ? "mb-4 flex items-center gap-3" : "mb-8")}>
          <h1 className={"font-bold text-[#0f4c81] flex items-center justify-center gap-2 " + (searchResults.length > 0 ? "text-2xl" : "text-4xl")}><Building2 size={searchResults.length > 0 ? 28 : 40} /> 台北榮總藥物查詢</h1>
          {searchResults.length === 0 && <p className="text-slate-500 text-lg mt-3 font-bold tracking-widest">臨床醫師專用搜尋引擎</p>}
        </div>
        <div className="w-full max-w-2xl px-6">
          <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-3 shadow-lg">
            <Search className="text-slate-400 mr-3 cursor-pointer" size={22} onClick={() => performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery)} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery)} className="flex-1 outline-none text-xl text-slate-800 bg-transparent" placeholder="輸入藥名或代碼..." />
            {searchQuery && <X className="text-slate-400 cursor-pointer ml-3" size={24} onClick={() => { setSearchQuery(''); setSearchResults([]); }} />}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8 px-6 font-bold text-sm">
          <button onClick={() => performSearch({}, '完整收錄藥物')} className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#0f4c81] text-[#0f4c81] bg-white"><Database size={18} /> 收錄藥物 <span className="bg-[#0f4c81] text-white px-2 py-0.5 rounded-full text-xs">{stats.total}</span></button>
          <button onClick={() => performSearch({ filter: 'reactions' }, '含不良反應資料庫')} className="flex items-center gap-2 px-5 py-2 rounded-full border border-rose-600 text-rose-600 bg-white"><AlertTriangle size={18} /> 不良反應藥物 <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs">{stats.with_reactions}</span></button>
          <button onClick={() => setShowCategories(!showCategories)} className="flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-600 text-emerald-600 bg-white"><HeartPulse size={18} /> 身體反應分類 <ChevronDown size={16}/></button>
        </div>
        {showCategories && (
          <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-4xl w-full mx-6 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(sys => (
                <span key={sys} onClick={() => { setSelectedCategory(sys); performSearch({ category: sys }, "分類：" + sys); setShowCategories(false); }} className={"px-4 py-1.5 border rounded-full text-sm font-bold cursor-pointer transition-colors " + (selectedCategory === sys ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 hover:border-emerald-400")}>{sys}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {searchResults.length > 0 && (
        <div className="max-w-5xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="text-xl font-bold text-slate-800">顯示 <strong>{currentLabel}</strong>，共 {searchResults.length} 筆</div>
            </div>
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm border-b"><tr><th className="p-5 text-center">藥碼</th><th className="p-5">藥物名稱</th><th className="p-5 text-right">狀態</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {searchResults.map((drug, i) => {
                  const rawAdverse = drug['adverse reaction'] || drug.adverse_reaction;
                  const hasReaction = rawAdverse && String(rawAdverse).toLowerCase() !== 'nan';
                  return (
                  <tr key={i} className={"cursor-pointer hover:bg-blue-50 transition-all " + (!hasReaction ? "bg-slate-50/50" : "")} onClick={() => { setSelectedDrug(drug); setView('drug_detail'); }}>
                    <td className="p-5 font-mono text-slate-500 font-bold text-center">{drug.id || drug['drug id'] || '-'}</td>
                    <td className="p-5 font-black text-[#0f4c81] text-lg">{drug.name}</td>
                    <td className="p-5 text-right">
                      {hasReaction ? <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black border border-rose-200">注意不良反應</span> : <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-xs font-black border border-slate-200">無記載</span>}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 15mm; }
          html, body, #root { 
            height: auto !important; min-height: 0 !important; width: 100% !important; max-width: 100% !important;
            overflow: visible !important; display: block !important; background: white !important; 
            margin: 0 !important; padding: 0 !important;
          }
          .flex { display: block !important; }
          .h-screen { height: auto !important; min-height: 0 !important; }
          .overflow-hidden, .overflow-y-auto { overflow: visible !important; }
          .max-w-5xl, .max-w-6xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; word-wrap: break-word !important; }
          .print-color-exact { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-text-main { color: #000 !important; font-size: 12pt !important; }
        }
      `}</style>
      
      <div className="flex h-screen bg-[#F8FAFC] font-sans text-left overflow-hidden">
        {renderSidebar()}
        
        {view === 'overview' && (
          <div className="flex-1 p-12 overflow-y-auto print:overflow-visible print:p-0">
            <h1 className="text-2xl font-black italic text-slate-800 mb-8 border-b-[3px] border-blue-600 inline-block pb-1 uppercase tracking-tighter print:hidden">患者住院紀錄</h1>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden max-w-6xl print:border-none print:shadow-none">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest print:bg-white print:text-black">
                  <tr>
                    <th className="py-6 px-8">病歷 ID</th>
                    <th className="py-6 px-8">病患</th>
                    <th className="py-6 px-8 text-center">Na+ / K+</th>
                    <th className="py-6 px-8 text-right pr-12">監測狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map(p => {
                    let statusColor = "bg-slate-50 text-slate-500 border-slate-200";
                    if (p.status.includes('危急') || p.status.includes('高')) statusColor = "bg-rose-50 text-rose-600 border-rose-200";
                    else if (p.status.includes('觀察') || p.status.includes('中')) statusColor = "bg-amber-50 text-amber-600 border-amber-200";
                    else if (p.status.includes('穩定') || p.status.includes('低')) statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";

                    return (
                      <tr key={p.id} onClick={() => handleSelectPatient(p)} className="hover:bg-blue-50/50 cursor-pointer group transition-all">
                        <td className="py-6 px-8 font-black text-blue-600">{p.id}</td>
                        <td className="py-6 px-8 text-slate-700 font-bold">{p.name} <span className="text-slate-400 font-normal ml-1">{p.info}</span></td>
                        <td className="py-6 px-8 text-center font-bold">{p.na} / {p.k}</td>
                        <td className="py-6 px-8 text-right pr-12">
                          <span className={`px-5 py-1.5 rounded-full text-[11px] font-bold border print-color-exact ${statusColor}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {view === 'dashboard' && renderDashboard()}
        {view === 'repository' && renderRepository()}
        
        {view === 'drug_detail' && selectedDrug && (() => {
          const rawAdverse = selectedDrug['adverse reaction'] || selectedDrug.adverse_reaction;
          const rawException = selectedDrug['exception handling'] || selectedDrug.exception_handling;

          return (
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative print:block print:h-auto print:bg-white print:overflow-visible print:p-0">
            <div className="sticky top-0 left-0 right-0 bg-white border-b-4 border-[#0f4c81] p-6 px-12 flex justify-between items-center z-50 shadow-sm print:hidden">
              <button onClick={() => setView('repository')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all"><ChevronLeft size={18}/> 返回查詢</button>
              <h1 className="text-3xl font-black text-[#0f4c81] flex-1 text-center">{selectedDrug.name}</h1>
              <div className="flex gap-3">
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-100 bg-blue-50 text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white rounded-full font-bold transition-colors"><Copy size={18}/> 複製內容</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-colors"><Printer size={18}/> 列印</button>
              </div>
            </div>
            
            <div className="hidden print:block mb-6 border-b-2 border-black pb-2 text-center mt-4">
              <h1 className="text-3xl font-black text-black">{selectedDrug.name} - 藥物不良反應詳情</h1>
            </div>

            {showCopyToast && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[200] flex items-center gap-2 fade-in print:hidden">
                <ClipboardCheck size={20} className="text-green-400"/> 已複製到剪貼簿
              </div>
            )}

            <div className="max-w-5xl mx-auto p-12 print:p-0 print:m-0 print:max-w-none print:w-full overflow-hidden print:overflow-visible">
              
              <div className="bg-white rounded-2xl p-10 shadow-sm border-l-[6px] border-rose-600 mb-8 print:border-none print:shadow-none print-break-avoid print:mb-4 print:p-0">
                <h2 className="text-2xl font-black text-rose-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black print:mb-2 print:pb-2">
                  <AlertTriangle size={28} className="print:hidden"/> 不良反應 (Adverse Reactions)
                </h2>
                <div dangerouslySetInnerHTML={{ __html: formatAndReplaceText(rawAdverse) }} />
              </div>
              
              {rawException && String(rawException).toLowerCase() !== 'nan' && (
                <div className="bg-white rounded-2xl p-10 shadow-sm border-l-[6px] border-blue-600 print:border-none print:shadow-none print-break-avoid print:p-0">
                  <h2 className="text-2xl font-black text-blue-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black print:mb-2 print:pb-2">
                    <AlertCircle size={28} className="print:hidden"/> 注意事項
                  </h2>
                  <div dangerouslySetInnerHTML={{ __html: formatAndReplaceText(rawException) }} />
                </div>
              )}
            </div>
          </div>
        )})()}
      </div>
    </>
  );
}

export default App;