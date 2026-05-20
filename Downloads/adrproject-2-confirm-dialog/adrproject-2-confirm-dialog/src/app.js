import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { ArrowLeft, Calendar, ChevronDown, AlertCircle, Search, Users, Activity, Building2, Database, AlertTriangle, HeartPulse, X, ChevronLeft, Copy, ClipboardCheck, Printer, Lock, User, Upload, Plus, Edit2, Trash2, Pill, SlidersHorizontal } from 'lucide-react';

const API_BASE = "/api";

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

  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // 藥物管理
  const [drugMgmtTab, setDrugMgmtTab] = useState('drugs');
  const [drugMgmtList, setDrugMgmtList] = useState([]);
  const [drugMgmtSearch, setDrugMgmtSearch] = useState('');
  const [drugMgmtStatus, setDrugMgmtStatus] = useState('');
  
  // 電解質影響
  const [eiList, setEiList] = useState([]);
  const [eiLoading, setEiLoading] = useState(false);
  const [eiAnalyte, setEiAnalyte] = useState('');
  const [eiDirection, setEiDirection] = useState('');
  const [eiKeyword, setEiKeyword] = useState('');

  // 院內特徵值區間
  const [referenceRanges, setReferenceRanges] = useState([]);
  const [refRangesLoading, setRefRangesLoading] = useState(false);
  const [editingRangeId, setEditingRangeId] = useState(null);
  const [editingRangeData, setEditingRangeData] = useState({});
  const [showAddRange, setShowAddRange] = useState(false);
  const [newRange, setNewRange] = useState({ ion_type: '', chinese_name: '', normal_min: '', normal_max: '', amr_min: '', amr_max: '', unit: '' });

  const [showEiModal, setShowEiModal] = useState(false);
  const [eiModalDrug, setEiModalDrug] = useState('');
  const [eiModalData, setEiModalData] = useState([]);
  const [eiModalLoading, setEiModalLoading] = useState(false);
  const [showAddEi, setShowAddEi] = useState(false);
  const [newEi, setNewEi] = useState({ drug_name: '', analyte: 'K', impact_direction: 'D', remarks: '' });
  const [editingEiKey, setEditingEiKey] = useState(null);
  const [editingEiData, setEditingEiData] = useState({});

  const [showAddDrug, setShowAddDrug] = useState(false);
  const [newDrug, setNewDrug] = useState({ id: '', name: '', adverse_reaction: '' });

  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
  const showConfirm = (message, onConfirm) => setConfirmModal({ show: true, message, onConfirm });
  const closeConfirm = () => setConfirmModal({ show: false, message: '', onConfirm: null });

  // 醫藥交互協作建議箱狀態
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [suggestionForm, setSuggestionForm] = useState({ drug_name: '', suggestion_type: '新增不良反應', content: '', reason: '' });
  const [showAddSuggestionModal, setShowAddSuggestionModal] = useState(false);
  const [reviewRemark, setReviewRemark] = useState('');
  const [activeReviewId, setActiveReviewId] = useState(null);
  // ✨ 新增：建議箱狀態過濾器
  const [suggestionFilter, setSuggestionFilter] = useState('ALL');

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API_BASE}/patients`).then(res => res.json()).then(json => { if (json.status === "success") setPatients(json.data); }).finally(() => setIsLoading(false));
      fetch(`${API_BASE}/stats`).then(res => res.json()).then(setStats).catch(() => {});
    }
  }, [isLoggedIn]);

  const isPharmacist = currentUser?.role === '藥師';

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const pharmacistViews = ['drug_mgmt', 'ref_ranges', 'repository', 'drug_detail', 'suggestions'];
    const doctorViews = ['overview', 'dashboard', 'repository', 'drug_detail', 'suggestions'];
    if (isPharmacist && !pharmacistViews.includes(view)) setView('drug_mgmt');
    if (!isPharmacist && !doctorViews.includes(view)) setView('overview');
  }, [view, isPharmacist, isLoggedIn, currentUser]);

  const loadSuggestions = () => {
    fetch(`${API_BASE}/suggestions`)
      .then(r => r.json())
      .then(j => { if (j.status === 'success') setSuggestionsList(j.data); })
      .catch((err) => console.error("載入建議失敗:", err));
  };

  useEffect(() => {
    if (view === 'suggestions') loadSuggestions();
  }, [view]);

  const loadEiData = (analyte = eiAnalyte, direction = eiDirection, keyword = eiKeyword) => {
    setEiLoading(true);
    const params = new URLSearchParams();
    if (analyte)   params.append('analyte',   analyte);
    if (direction) params.append('direction', direction);
    if (keyword)   params.append('keyword',   keyword);
    fetch(`${API_BASE}/electrolyte_impact?${params}`)
      .then(r => r.json())
      .then(j => { if (j.status === 'success') setEiList(j.data); })
      .catch(() => {})
      .finally(() => setEiLoading(false));
  };

  useEffect(() => {
    if (view === 'drug_mgmt' && drugMgmtTab === 'electrolyte' && eiList.length === 0) loadEiData();
  }, [drugMgmtTab, view]);

  const loadRefRanges = () => {
    setRefRangesLoading(true);
    fetch(`${API_BASE}/ref_ranges`)
      .then(r => r.json())
      .then(j => { if (j.status === 'success') setReferenceRanges(j.data); })
      .catch(() => {})
      .finally(() => setRefRangesLoading(false));
  };

  useEffect(() => {
    if (view === 'ref_ranges') loadRefRanges();
  }, [view]);

  useEffect(() => {
    if (view === 'drug_mgmt' && drugMgmtList.length === 0) {
      fetch(`${API_BASE}/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        .then(r => r.json())
        .then(j => { if (j.status === 'success') setDrugMgmtList(j.data); })
        .catch(() => {});
    }
  }, [view]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    setLoginError('');
    setIsLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setCurrentUser(json.user);
        setView(json.user.role === '藥師' ? 'drug_mgmt' : 'overview');
        setIsLoggedIn(true);
      } else {
        setLoginError(json.message || '登入失敗');
      }
    } catch (err) {
      setLoginError(`連線失敗: ${err.message}`);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView('overview');
  };

  const handleAddDrug = async () => {
    if (!newDrug.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/drugs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDrug),
      });
      const j = await res.json();
      if (j.status === 'success') {
        setDrugMgmtList(prev => [...prev, j.data]);
        setNewDrug({ id: '', name: '', adverse_reaction: '' });
        setShowAddDrug(false);
      } else {
        setDrugMgmtStatus(`error:${j.message}`);
      }
    } catch {}
  };

  const handleDeleteDrug = (drug) => {
    showConfirm(`確定刪除「${drug.name}」？此操作無法復原。`, async () => {
      try {
        const res = await fetch(`${API_BASE}/drugs/${encodeURIComponent(drug.name)}`, { method: 'DELETE' });
        const j = await res.json();
        if (j.status === 'success') setDrugMgmtList(prev => prev.filter(d => d.name !== drug.name));
      } catch {}
    });
  };

  const openDrugModal = async (drugName) => {
    setEiModalDrug(drugName);
    setEiModalData([]);
    setShowEiModal(true);
    setEiModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/electrolyte_impact?keyword=${encodeURIComponent(drugName)}`);
      const j = await res.json();
      if (j.status === 'success') setEiModalData(j.data.filter(r => r.drug_name === drugName));
    } catch {}
    finally { setEiModalLoading(false); }
  };

  const handleAddEi = async () => {
    if (!newEi.drug_name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/electrolyte_impact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEi),
      });
      const j = await res.json();
      if (j.status === 'success') {
        setEiList(prev => [...prev, j.data]);
        setNewEi({ drug_name: '', analyte: 'K', impact_direction: 'D', remarks: '' });
        setShowAddEi(false);
      }
    } catch {}
  };

  const handleUpdateEi = async () => {
    try {
      const res = await fetch(`${API_BASE}/electrolyte_impact`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEiData),
      });
      const j = await res.json();
      if (j.status === 'success') {
        setEiList(prev => prev.map(r =>
          r.drug_name === editingEiData.orig_drug_name &&
          r.analyte === editingEiData.orig_analyte &&
          r.impact_direction === editingEiData.orig_impact_direction ? j.data : r
        ));
        setEditingEiKey(null);
      }
    } catch {}
  };

  const handleDeleteEi = (row) => {
    showConfirm(`確定刪除「${row.drug_name} - ${row.analyte} ${row.impact_direction === 'E' ? '↑升高' : '↓降低'}」？`, async () => {
      try {
        const res = await fetch(`${API_BASE}/electrolyte_impact`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drug_name: row.drug_name, analyte: row.analyte, impact_direction: row.impact_direction }),
        });
        const j = await res.json();
        if (j.status === 'success') {
          setEiList(prev => prev.filter(r =>
            !(r.drug_name === row.drug_name && r.analyte === row.analyte && r.impact_direction === row.impact_direction)
          ));
        }
      } catch {}
    });
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

  const renderSidebar = () => {
    if (!isLoggedIn) return null;
    return (
      <div className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 justify-between shrink-0 print:hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12 px-2">
            <Activity size={32} className="text-blue-600" />
            <span className="text-2xl font-black italic text-slate-800">ADR <span className="text-blue-600">PRO</span></span>
          </div>

          <nav className="flex-1 space-y-2">
            {!isPharmacist && (
              <>
                <button
                  onClick={() => setView('overview')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'overview' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Users size={20} /> 患者住院紀錄
                </button>
                <button
                  onClick={() => { setView('repository'); setSearchResults([]); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'repository' || view === 'drug_detail' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Search size={20} /> 藥物查詢
                </button>
                <button
                  onClick={() => setView('suggestions')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'suggestions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardCheck size={20} /> 用藥修改建議
                </button>
              </>
            )}

            {isPharmacist && (
              <>
                <button
                  onClick={() => setView('drug_mgmt')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'drug_mgmt' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Pill size={20} /> 藥物管理
                </button>
                <button
                  onClick={() => { setView('repository'); setSearchResults([]); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'repository' || view === 'drug_detail' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Search size={20} /> 藥物查詢
                </button>
                <button
                  onClick={() => setView('ref_ranges')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'ref_ranges' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={20} /> 特徵值區間
                </button>
                <button
                  onClick={() => setView('suggestions')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    view === 'suggestions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle size={20} /> 醫師變更建議審查
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-8 pb-2">
          {currentUser && (
            <div className="flex items-center gap-4 px-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-slate-700 truncate">{currentUser.name}</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{currentUser.role === '藥師' ? "藥師" : "醫師"}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
          >
            登出系統
          </button>
        </div>
      </div>
    );
  };

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

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-8 print:shadow-none print:border-none print:p-0">
          <div className="h-80 w-full mb-6">
            <ResponsiveContainer className="focus:outline-none">
              <LineChart data={visibleTrends} className="focus:outline-none">
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
                  <div className="w-48 text-left pr-4 shrink-0">
                    <p className="text-[11px] font-black text-slate-700 italic uppercase">{med.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{med.type}</p>
                  </div>
                  {/* ✨ 修復：加回了外圍負責定位的灰底容器，甘特條就不會跑版了 */}
                  <div className="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 shadow-inner">
                    {width > 0 && (
                      <div className="absolute h-full opacity-80 rounded-lg flex items-center px-4 transition-all" style={{ left: left + '%', width: width + '%', backgroundColor: med.color }}>
                        <span className="text-[8px] text-white font-black whitespace-nowrap">{med.startDate} - {med.endDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-8 text-left print:shadow-none print:border-none print:p-0">
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

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-12 text-left print:shadow-none print:border-none print:p-0">
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

  const renderDrugManagement = () => {
    const filtered = drugMgmtList.filter(d =>
      String(d.name || '').toLowerCase().includes(drugMgmtSearch.toLowerCase()) ||
      String(d.id || d['drug id'] || '').toLowerCase().includes(drugMgmtSearch.toLowerCase())
    );

    const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            setDrugMgmtList(data);
            setDrugMgmtStatus(`success:成功匯入 ${data.length} 筆藥物資料`);
          } else {
            setDrugMgmtStatus('error:格式錯誤：需為 JSON 陣列');
          }
        } catch {
          setDrugMgmtStatus('error:解析失敗：請確認為有效 JSON 檔案');
        }
      };
      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    };

    const applyEiFilter = () => loadEiData(eiAnalyte, eiDirection, eiKeyword);
    const resetEiFilter = () => {
      setEiAnalyte(''); setEiDirection(''); setEiKeyword('');
      loadEiData('', '', '');
    };

    const [statusType, statusText] = drugMgmtStatus ? drugMgmtStatus.split(':') : ['', ''];
    const btnTab = (tab, label) => (
      <button onClick={() => setDrugMgmtTab(tab)}
        className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${drugMgmtTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}>
        {label}
      </button>
    );

    return (
      <div className="flex-1 p-12 overflow-y-auto bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic text-slate-800 border-b-[3px] border-blue-600 inline-block pb-1 uppercase tracking-tighter">藥物管理</h1>
          {drugMgmtTab === 'drugs' && (
            <div className="flex gap-3">
              <button onClick={() => setShowAddDrug(v => !v)} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                <Plus size={18} /> 新增藥物
              </button>
              <label className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                <Upload size={18} /> 匯入 JSON
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          )}
          {drugMgmtTab === 'electrolyte' && (
            <button onClick={() => setShowAddEi(v => !v)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              <Plus size={18} /> 新增記錄
            </button>
          )}
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-2xl p-1.5 mb-6 w-fit">
          {btnTab('drugs', '藥物不良反應')}
          {btnTab('electrolyte', '電解質影響')}
        </div>

        {drugMgmtTab === 'drugs' && (() => {
          const fldCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
          return (
          <>
            {showAddDrug && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-5">
                <h3 className="font-black text-slate-700 mb-4">新增藥物</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">藥物名稱 *</label>
                    <input type="text" className={fldCls} placeholder="e.g. Furosemide"
                      value={newDrug.name} onChange={e => setNewDrug(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">藥碼</label>
                    <input type="text" className={fldCls} placeholder="（選填）"
                      value={newDrug.id} onChange={e => setNewDrug(p => ({...p, id: e.target.value}))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 mb-1 block">不良反應</label>
                    <textarea rows={4} className={fldCls + " resize-y"} placeholder="輸入不良反應內容（選填）"
                      value={newDrug.adverse_reaction} onChange={e => setNewDrug(p => ({...p, adverse_reaction: e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddDrug} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all">確認新增</button>
                  <button type="button" onClick={() => setShowAddDrug(false)} className="px-5 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
                </div>
              </div>
            )}

            {statusText && (
              <div className={`mb-5 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border ${statusType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                <AlertCircle size={16} /> {statusText}
              </div>
            )}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm mb-4">
              <Search size={18} className="text-slate-400 mr-3" />
              <input type="text" value={drugMgmtSearch} onChange={e => setDrugMgmtSearch(e.target.value)} placeholder="搜尋藥物名稱或藥碼..." className="flex-1 outline-none text-slate-700 font-bold bg-transparent" />
              {drugMgmtSearch && <X size={18} className="text-slate-400 cursor-pointer" onClick={() => setDrugMgmtSearch('')} />}
            </div>
            <p className="text-slate-400 font-bold text-sm mb-5">
              共 <strong className="text-slate-700">{drugMgmtList.length}</strong> 筆
              {drugMgmtSearch && <span className="text-blue-500 ml-2">篩選：{filtered.length} 筆</span>}
            </p>
            {drugMgmtList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <Pill size={52} className="mb-4" />
                <p className="font-black text-lg text-slate-400">尚未載入藥物資料</p>
                <p className="text-sm mt-1 text-slate-400">後端已連線時將自動載入，或點右上角新增 / 匯入 JSON</p>
              </div>
            ) : (
              // ✨ 修復：加上 overflow-x-auto 允許左右滑動，避免欄位被遮住
              <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="py-5 px-6 text-center w-28">藥碼</th>
                      <th className="py-5 px-6 w-1/4">藥物名稱</th>
                      <th className="py-5 px-6">不良反應摘要</th>
                      <th className="py-5 px-6 text-center w-32">狀態</th>
                      <th className="py-5 px-6 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((drug, i) => {
                      const raw = drug['adverse reaction'] || drug.adverse_reaction;
                      const hasRx = raw && String(raw).toLowerCase() !== 'nan';
                      const preview = hasRx ? String(raw).replace(/<[^>]*>/g, '').trim().slice(0, 90) + '…' : '無記載';
                      return (
                        <tr key={i} className="hover:bg-blue-50/30 transition-all">
                          <td className="py-5 px-6 font-mono text-slate-400 font-bold text-sm text-center">{drug.id || drug['drug id'] || '—'}</td>
                          <td className="py-5 px-6 font-black text-slate-800">{drug.name}</td>
                          {/* ✨ 修復：限制摘要欄位最大寬度，確保不會擠壓右側按鈕 */}
                          <td className="py-5 px-6 text-slate-400 font-bold text-sm max-w-[200px] truncate">{preview}</td>
                          <td className="py-5 px-6 text-center">
                            {hasRx ? <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-black border border-rose-200 whitespace-nowrap">有不良反應</span>
                                    : <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">無記載</span>}
                          </td>
                          <td className="py-5 px-6 text-center">
                            <button onClick={() => handleDeleteDrug(drug)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
          );
        })()}

        {drugMgmtTab === 'electrolyte' && (() => {
          const fldCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
          return (
          <>
            {showAddEi && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-5">
                <h3 className="font-black text-slate-700 mb-4">新增電解質影響記錄</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">藥物名稱 *</label>
                    <input type="text" className={fldCls} placeholder="e.g. Furosemide"
                      value={newEi.drug_name} onChange={e => setNewEi(p => ({...p, drug_name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">電解質</label>
                    <select className={fldCls} value={newEi.analyte} onChange={e => setNewEi(p => ({...p, analyte: e.target.value}))}>
                      <option value="K">K（鉀）</option>
                      <option value="Na">Na（鈉）</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">影響方向</label>
                    <select className={fldCls} value={newEi.impact_direction} onChange={e => setNewEi(p => ({...p, impact_direction: e.target.value}))}>
                      <option value="D">D — 降低 ↓</option>
                      <option value="E">E — 升高 ↑</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">備註</label>
                    <input type="text" className={fldCls} placeholder="（選填）"
                      value={newEi.remarks} onChange={e => setNewEi(p => ({...p, remarks: e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddEi} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all">確認新增</button>
                  <button type="button" onClick={() => setShowAddEi(false)} className="px-5 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex-1 min-w-48">
                <Search size={16} className="text-slate-400 mr-2" />
                <input type="text" value={eiKeyword} onChange={e => setEiKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyEiFilter()}
                  placeholder="搜尋藥物名稱..." className="flex-1 outline-none text-slate-700 font-bold bg-transparent text-sm" />
              </div>
              <select value={eiAnalyte} onChange={e => setEiAnalyte(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-600 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">全部電解質</option>
                <option value="Na">Na（鈉）</option>
                <option value="K">K（鉀）</option>
              </select>
              <select value={eiDirection} onChange={e => setEiDirection(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-600 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">全部方向</option>
                <option value="D">D — 降低 ↓</option>
                <option value="E">E — 升高 ↑</option>
              </select>
              <button onClick={applyEiFilter} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm">套用篩選</button>
              <button onClick={resetEiFilter} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">重設</button>
            </div>

            <p className="text-slate-400 font-bold text-sm mb-4">
              共 <strong className="text-slate-700">{eiList.length}</strong> 筆影響記錄
              <span className="text-blue-400 ml-2 font-bold">— 點選藥物名稱可查看詳情</span>
            </p>

            {eiLoading ? (
              <div className="py-20 text-center text-slate-400 font-bold">載入中…</div>
            ) : eiList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <Activity size={52} className="mb-4" />
                <p className="font-black text-lg text-slate-400">無符合資料</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="py-5 px-6">藥物名稱</th>
                      <th className="py-5 px-6 text-center w-24">電解質</th>
                      <th className="py-5 px-6 text-center w-36">影響方向</th>
                      <th className="py-5 px-6">備註</th>
                      <th className="py-5 px-6 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {eiList.map((row, i) => {
                      const isUp = row.impact_direction === 'E';
                      const isDown = row.impact_direction === 'D';
                      const eiKey = `${row.drug_name}|${row.analyte}|${row.impact_direction}`;
                      const inFldCls = "w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";
                      if (editingEiKey === eiKey) {
                        return (
                          <tr key={i} className="bg-blue-50/40">
                            <td className="py-3 px-4"><input className={inFldCls} value={editingEiData.drug_name} onChange={e => setEditingEiData(p => ({...p, drug_name: e.target.value}))} /></td>
                            <td className="py-3 px-4">
                              <select className={inFldCls} value={editingEiData.analyte} onChange={e => setEditingEiData(p => ({...p, analyte: e.target.value}))}>
                                <option value="K">K</option><option value="Na">Na</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select className={inFldCls} value={editingEiData.impact_direction} onChange={e => setEditingEiData(p => ({...p, impact_direction: e.target.value}))}>
                                <option value="D">↓ 降低</option><option value="E">↑ 升高</option>
                              </select>
                            </td>
                            <td className="py-3 px-4"><input className={inFldCls} value={editingEiData.remarks || ''} onChange={e => setEditingEiData(p => ({...p, remarks: e.target.value}))} /></td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-1">
                                <button onClick={handleUpdateEi} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700">儲存</button>
                                <button type="button" onClick={() => setEditingEiKey(null)} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs hover:bg-slate-200">取消</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={i} className="hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => openDrugModal(row.drug_name)}>
                          <td className="py-4 px-6 font-black text-blue-600 hover:underline">{row.drug_name}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full font-black text-sm border ${row.analyte === 'Na' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{row.analyte}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isUp  && <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full font-black text-sm">升高</span>}
                            {isDown && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-black text-sm">降低</span>}
                            {!isUp && !isDown && <span className="text-slate-400 font-bold text-sm">{row.impact_direction}</span>}
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-bold text-sm">{row.remarks || '—'}</td>
                          <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-center gap-1">
                              <button onClick={() => { setEditingEiKey(eiKey); setEditingEiData({...row, orig_drug_name: row.drug_name, orig_analyte: row.analyte, orig_impact_direction: row.impact_direction}); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteEi(row)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
          );
        })()}
      </div>
    );
  };

  const renderReferenceRanges = () => {
    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

    const handleEdit = (range) => {
      setEditingRangeId(range.ion_type);
      setEditingRangeData({ ...range });
    };

    const handleSave = async () => {
      const { ion_type, ...payload } = editingRangeData;
      const res = await fetch(`${API_BASE}/ref_ranges/${ion_type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReferenceRanges(prev => prev.map(r => r.ion_type === ion_type ? json.data : r));
        setEditingRangeId(null);
      }
    };

    const handleDelete = (range) => {
      showConfirm(`確定刪除「${range.ion_type}（${range.chinese_name || range.ion_type}）」？此操作無法復原。`, async () => {
        const res = await fetch(`${API_BASE}/ref_ranges/${range.ion_type}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.status === 'success') setReferenceRanges(prev => prev.filter(r => r.ion_type !== range.ion_type));
      });
    };

    const handleAdd = async () => {
      if (!newRange.ion_type.trim()) return;
      const res = await fetch(`${API_BASE}/ref_ranges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRange),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReferenceRanges(prev => [...prev, json.data]);
        setNewRange({ ion_type: '', chinese_name: '', normal_min: '', normal_max: '', amr_min: '', amr_max: '', unit: '' });
        setShowAddRange(false);
      }
    };

    const addFields = [
      { label: '離子符號 *',  key: 'ion_type',     type: 'text',   placeholder: 'e.g. Ca' },
      { label: '中文名稱',    key: 'chinese_name', type: 'text',   placeholder: 'e.g. 鈣' },
      { label: '單位',        key: 'unit',         type: 'text',   placeholder: 'e.g. mmol/L' },
      { label: '正常下限',    key: 'normal_min',   type: 'number', placeholder: '0' },
      { label: '正常上限',    key: 'normal_max',   type: 'number', placeholder: '0' },
      { label: '危急低值',    key: 'amr_min',      type: 'number', placeholder: '（選填）' },
      { label: '危急高值',    key: 'amr_max',      type: 'number', placeholder: '（選填）' },
    ];

    return (
      <div className="flex-1 p-12 overflow-y-auto bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black italic text-slate-800 border-b-[3px] border-blue-600 inline-block pb-1 uppercase tracking-tighter">院內特徵值區間</h1>
          <div className="flex gap-3">
            <button onClick={loadRefRanges} className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              {refRangesLoading ? '載入中…' : '重新整理'}
            </button>
            <button onClick={() => setShowAddRange(v => !v)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              <Plus size={18} /> 新增項目
            </button>
          </div>
        </div>

        {showAddRange && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8 mb-6">
            <h3 className="font-black text-slate-700 mb-5 text-lg">新增離子項目</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {addFields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">{f.label}</label>
                  <input type={f.type} className={inputCls} placeholder={f.placeholder}
                    value={newRange[f.key]}
                    onChange={e => setNewRange(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all">確認新增</button>
              <button type="button" onClick={() => setShowAddRange(false)} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {refRangesLoading && referenceRanges.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold">載入中…</div>
          ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <tr>
                <th className="py-5 px-5 text-center w-20">符號</th>
                <th className="py-5 px-5">中文名稱</th>
                <th className="py-5 px-5 text-center">單位</th>
                <th className="py-5 px-5 text-center">正常區間</th>
                <th className="py-5 px-5 text-center">危急低值</th>
                <th className="py-5 px-5 text-center">危急高值</th>
                <th className="py-5 px-5 text-center">最後更新</th>
                <th className="py-5 px-5 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referenceRanges.map(range => (
                <tr key={range.ion_type} className="hover:bg-slate-50/50 transition-all">
                  {editingRangeId === range.ion_type ? (
                    <>
                      <td className="py-3 px-3 font-black text-blue-600 text-center">{range.ion_type}</td>
                      <td className="py-3 px-3"><input className={inputCls} value={editingRangeData.chinese_name} onChange={e => setEditingRangeData(p => ({ ...p, chinese_name: e.target.value }))} /></td>
                      <td className="py-3 px-3"><input className={inputCls} value={editingRangeData.unit} onChange={e => setEditingRangeData(p => ({ ...p, unit: e.target.value }))} /></td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <input type="number" className={inputCls} value={editingRangeData.normal_min} onChange={e => setEditingRangeData(p => ({ ...p, normal_min: e.target.value }))} />
                          <span className="text-slate-400 font-bold">–</span>
                          <input type="number" className={inputCls} value={editingRangeData.normal_max} onChange={e => setEditingRangeData(p => ({ ...p, normal_max: e.target.value }))} />
                        </div>
                      </td>
                      <td className="py-3 px-3"><input type="number" className={inputCls} value={editingRangeData.amr_min ?? ''} onChange={e => setEditingRangeData(p => ({ ...p, amr_min: e.target.value }))} /></td>
                      <td className="py-3 px-3"><input type="number" className={inputCls} value={editingRangeData.amr_max ?? ''} onChange={e => setEditingRangeData(p => ({ ...p, amr_max: e.target.value }))} /></td>
                      <td className="py-3 px-3 text-slate-300 text-xs text-center">—</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700">儲存</button>
                          <button type="button" onClick={() => setEditingRangeId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs hover:bg-slate-200">取消</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-5 px-5 font-black text-blue-600 text-center text-lg">{range.ion_type}</td>
                      <td className="py-5 px-5 font-black text-slate-700">{range.chinese_name || '—'}</td>
                      <td className="py-5 px-5 text-center font-mono font-bold text-slate-400 text-sm">{range.unit}</td>
                      <td className="py-5 px-5 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black text-sm border border-emerald-200">{range.normal_min} – {range.normal_max}</span>
                      </td>
                      <td className="py-5 px-5 text-center">
                        {range.amr_min != null ? <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-sm border border-blue-200">&lt; {range.amr_min}</span> : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      <td className="py-5 px-5 text-center">
                        {range.amr_max != null ? <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black text-sm border border-rose-200">&gt; {range.amr_max}</span> : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      <td className="py-5 px-5 text-center text-xs text-slate-400 font-bold">{range.last_updated}</td>
                      <td className="py-5 px-5 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEdit(range)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(range)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    const handleDocSubmit = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!suggestionForm.drug_name.trim() || !suggestionForm.content.trim()) {
        alert('請填寫所有必填欄位');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drug_name: suggestionForm.drug_name.trim(),
            suggestion_type: suggestionForm.suggestion_type,
            content: suggestionForm.content.trim(),
            reason: suggestionForm.reason.trim(),
            doctor_name: currentUser?.name || '未知醫師'
          })
        });
        const j = await res.json();
        if (j.status === 'success') {
          alert('建議已成功同步至藥師端！');
          setShowAddSuggestionModal(false);
          setSuggestionForm({ drug_name: '', suggestion_type: '新增不良反應', content: '', reason: '' });
          loadSuggestions();
        } else {
          alert('同步失敗: ' + (j.message || '未知錯誤'));
        }
      } catch (err) { 
        alert('無法連線至後端伺服器'); 
      }
    };

    const handlePharmaUpdate = async (id, status, remark = '') => {
      try {
        const res = await fetch(`${API_BASE}/suggestions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, pharmacist_remark: remark })
        });
        const j = await res.json();
        if (j.status === 'success') {
          setActiveReviewId(null);
          setReviewRemark('');
          loadSuggestions();
        }
      } catch (err) { alert('審查更新失敗'); }
    };

    const fldCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all";

    // ✨ 根據選擇的過濾器過濾列表
    const filteredSuggestions = suggestionsList.filter(item => {
      if (suggestionFilter === 'PENDING') return item.status === '待確認';
      if (suggestionFilter === 'COMPLETED') return item.status === '已完成';
      if (suggestionFilter === 'REJECTED') return item.status === '已否定';
      return true; // 'ALL' 狀態
    });

    return (
      <div className="flex-1 p-12 overflow-y-auto bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-8">
          {/* ✨ 加入下拉式選單篩選 */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black italic text-slate-800 border-b-[3px] border-blue-600 inline-block pb-1 uppercase tracking-tighter">
              {isPharmacist ? '醫師變更建議審查' : '藥物修改與意見回饋'}
            </h1>
            <select 
              value={suggestionFilter} 
              onChange={(e) => setSuggestionFilter(e.target.value)}
              className="ml-2 bg-white border border-slate-200 rounded-lg px-4 py-2 font-bold text-slate-600 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="ALL">全部狀態</option>
              <option value="PENDING">待確認</option>
              <option value="COMPLETED">已完成</option>
              <option value="REJECTED">已否定</option>
            </select>
          </div>
          {!isPharmacist && (
            <button 
              type="button"
              onClick={() => setShowAddSuggestionModal(true)} 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              <Plus size={18} /> 填寫新修訂建議
            </button>
          )}
        </div>

        {!isPharmacist && showAddSuggestionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 text-white p-6 font-black flex justify-between items-center">
                <h3 className="text-lg">提出藥物修正建議</h3>
                <button type="button" onClick={() => setShowAddSuggestionModal(false)} className="hover:text-gray-300">✕</button>
              </div>
              <form onSubmit={handleDocSubmit} className="p-6 space-y-5 text-left">
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1 block uppercase">藥物名稱 *</label>
                  <input type="text" required placeholder="例如: Amiodarone" className={fldCls} value={suggestionForm.drug_name} onChange={e => setSuggestionForm({...suggestionForm, drug_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1 block uppercase">建議變更類型 *</label>
                  <select className={fldCls} value={suggestionForm.suggestion_type} onChange={e => setSuggestionForm({...suggestionForm, suggestion_type: e.target.value})}>
                    <option>新增不良反應</option>
                    <option>修改現有敘述</option>
                    <option>修正電解質影響</option>
                    <option>其他建議</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1 block uppercase">建議調整內容 *</label>
                  <textarea required rows="3" placeholder="請詳細說明需要更動或新增的警示內容敘述..." className={fldCls + " resize-none"} value={suggestionForm.content} onChange={e => setSuggestionForm({...suggestionForm, content: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1 block uppercase">臨床理由/佐證 (選填)</label>
                  <textarea rows="2" placeholder="例如：文獻指引、臨床真實病患反應..." className={fldCls + " resize-none"} value={suggestionForm.reason} onChange={e => setSuggestionForm({...suggestionForm, reason: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddSuggestionModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">取消</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">提交同步</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <tr>
                <th className="py-5 px-6">藥物 / 提報醫護</th>
                <th className="py-5 px-6">修訂建議內容</th>
                <th className="py-5 px-6 text-center w-32">目前的狀態</th>
                {isPharmacist && <th className="py-5 px-6 text-center w-52">藥師審查操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuggestions.length === 0 ? (
                <tr>
                  <td colSpan={isPharmacist ? 4 : 3} className="py-16 text-center text-slate-400 font-bold">
                    <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    無符合條件之修訂建議紀錄
                  </td>
                </tr>
              ) : (
                filteredSuggestions.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
                    <td className="py-6 px-6">
                      <div className="font-black text-slate-800 text-base">{item.drug_name}</div>
                      <div className="text-xs text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                        {item.suggestion_type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-2">
                        由 <span className="text-slate-600">{item.doctor_name}</span> 於 {item.created_at} 提報
                      </div>
                    </td>
                    <td className="py-6 px-6 max-w-xs">
                      <div className="text-slate-700 font-semibold bg-slate-50/50 p-3 rounded-xl border border-slate-100/60 whitespace-pre-wrap">{item.content}</div>
                      {item.reason && (
                        <div className="text-xs text-slate-400 font-bold mt-2 flex items-start gap-1">
                          <span>依據：{item.reason}</span>
                        </div>
                      )}
                      {item.pharmacist_remark && (
                        <div className="text-xs text-rose-600 bg-rose-50/60 border border-rose-100 p-3 rounded-xl mt-3 font-bold">
                          藥師審查意見：{item.pharmacist_remark}
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wide ${
                        item.status === '已完成' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        item.status === '已否定' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {isPharmacist && (
                      <td className="py-6 px-6 text-center">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          <div className="flex gap-1">
                            <button type="button" onClick={() => handlePharmaUpdate(item.id, '已完成')} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm transition-all">完成</button>
                            <button type="button" onClick={() => handlePharmaUpdate(item.id, '待確認')} className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black shadow-sm transition-all">待確認</button>
                            <button type="button" onClick={() => { setActiveReviewId(item.id); setReviewRemark(item.pharmacist_remark || ''); }} className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-sm transition-all">否定</button>
                          </div>
                          {activeReviewId === item.id && (
                            <div className="mt-2 p-2 bg-slate-50 border rounded-xl space-y-2 text-left w-full shadow-inner animate-fade-in">
                              <label className="text-[10px] font-black text-slate-400 block">請註記否定原因：</label>
                              <input type="text" placeholder="例如：臨床指引記載不符..." className="w-full p-2 text-xs border rounded-lg bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200" value={reviewRemark} onChange={e => setReviewRemark(e.target.value)} />
                              <button type="button" onClick={() => handlePharmaUpdate(item.id, '已否定', reviewRemark)} className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[10px] rounded-md font-black tracking-widest transition-all">確認送出意見</button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-rose-100 rounded-full blur-3xl opacity-50"></div>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-12 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
              <Activity size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center tracking-tight leading-snug">
              台北榮總<br/>藥物不良反應偵測系統
            </h1>
            <p className="text-slate-400 font-bold mt-3 tracking-widest text-sm uppercase">ADR Pro System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm ml-1">帳號</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" name="username" placeholder="請輸入院內帳號" className={inputCls} required />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm ml-1">密碼</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" name="password" placeholder="請輸入密碼" className={inputCls} required />
                </div>
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm font-bold">
                  <AlertCircle size={16} /> {loginError}
                </div>
              )}
              <button type="submit" disabled={isLoginLoading} className="w-full bg-blue-600 text-white rounded-xl py-4 font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoginLoading ? '驗證中...' : '登 入 系 統'}
              </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ✨ 隱藏 Recharts 點擊圖表時自帶的 focus 黑邊/藍框 */
        .recharts-wrapper:focus { outline: none !important; }
        .recharts-surface:focus { outline: none !important; }
        
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
        {view === 'drug_mgmt' && renderDrugManagement()}
        {view === 'ref_ranges' && renderReferenceRanges()}
        {view === 'suggestions' && renderSuggestions()}
        
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

      {showEiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-6" onClick={() => setShowEiModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-800">{eiModalDrug}</h2>
                <p className="text-sm text-slate-400 font-bold mt-0.5">電解質影響與不良反應摘要</p>
              </div>
              <button type="button" onClick={() => setShowEiModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={22} className="text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto p-8 flex-1">
              {eiModalLoading ? (
                <div className="text-center text-slate-400 font-bold py-12">載入中…</div>
              ) : (
                <>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">電解質影響</h3>
                  {eiModalData.length === 0 ? (
                    <p className="text-slate-300 font-bold text-sm py-4 mb-6">無電解質影響記錄</p>
                  ) : (
                    <div className="space-y-2.5 mb-8">
                      {eiModalData.map((r, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className={`px-3 py-1 rounded-full font-black text-sm border ${r.analyte === 'Na' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{r.analyte}</span>
                          {r.impact_direction === 'E'
                            ? <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full font-black text-sm">升高</span>
                            : <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-black text-sm">降低</span>}
                          {r.remarks && <span className="text-slate-400 font-bold text-sm flex-1">{r.remarks}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const drugInfo = drugMgmtList.find(d => d.name === eiModalDrug);
                    const rawAdverse = drugInfo?.['adverse reaction'] || drugInfo?.adverse_reaction;
                    if (!rawAdverse || String(rawAdverse).toLowerCase() === 'nan') return null;
                    const preview = String(rawAdverse).replace(/<[^>]*>/g, '').trim().slice(0, 400);
                    return (
                      <>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">不良反應摘要</h3>
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-slate-600 text-sm leading-relaxed">
                          {preview}…
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeConfirm} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-black text-slate-800">確認刪除</h2>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={closeConfirm} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                取消
              </button>
              <button type="button" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;