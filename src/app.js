import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Label } from 'recharts';
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
  const [patientSearchText, setPatientSearchText] = useState('');
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [selectedMedRecord, setSelectedMedRecord] = useState(null);
  const [drugDetailReturnView, setDrugDetailReturnView] = useState('repository');
  const [stats, setStats] = useState({ total: 0, with_reactions: 0 });
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);

  const categories = ["Cardiovascular", "Dermatologic", "Endocrine & metabolic", "Gastrointestinal", "Genitourinary", "Hematologic & oncologic", "Hepatic", "Local", "Nervous system", "Neuromuscular & skeletal", "Respiratory", "Otic", "Renal", "Hypersensitivity", "Immunologic", "Psychiatric", "Musculoskeletal", "Ophthalmic", "Miscellaneous"];

  const [startIndex, setStartIndex] = useState(0);
  const [windowSize, setWindowSize] = useState(7);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [lookbackDays, setLookbackDays] = useState(7);
  const [selectedIons, setSelectedIons] = useState(['Na', 'K']);
  const [showIonMenu, setShowIonMenu] = useState(false);
  const [showNormalRange, setShowNormalRange] = useState(true);
  const [showDrugLabels, setShowDrugLabels] = useState(true);
  const [showAbnormalPanel, setShowAbnormalPanel] = useState(true);
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
  const [showDrugMgmtSuggestions, setShowDrugMgmtSuggestions] = useState(false);

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
    if (!isLoggedIn) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const patientRes = await fetch(`${API_BASE}/patients`);
        const patientJson = await patientRes.json();

        if (patientJson.status === "success") {
          const patientList = patientJson.data || [];
          setPatients(patientList);
          
          if (patientList.length > 0) {
            const firstPatient = patientList[0];
            setSelectedPatient(firstPatient);

            const firstAdmissions = firstPatient.admissions || [];
            setAdmissions(firstAdmissions);

            if (firstAdmissions.length > 0) {
              setCurrentAdm(firstAdmissions[0]);
              setClinicalData(firstAdmissions[0].clinicalData || {
                trends: [],
                gantt: [],
                logs: []
              });
              if (firstAdmissions[0].admitRaw) {
                setDateStart(firstAdmissions[0].admitRaw.slice(0, 10));
              }

              if (firstAdmissions[0].dischargeRaw) {
                setDateEnd(firstAdmissions[0].dischargeRaw.slice(0, 10));
              }
            }
          }
        }
        const statsRes = await fetch(`${API_BASE}/stats`);
        const statsJson = await statsRes.json();
        setStats(statsJson);
      } catch (err) {
        console.error("初始化資料載入失敗:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
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
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
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
        if (j.status === 'success') {
          setDrugMgmtList(prev => prev.filter(d => d.name !== drug.name));
        }
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
      if (j.status === 'success') {
        setEiModalData(j.data.filter(r => r.drug_name === drugName));
      }
    } catch {} 
    finally { setEiModalLoading(false); }
  };

  const handleAddEi = async () => {
    if (!newEi.drug_name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/electrolyte_impact`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
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
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
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
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' },
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
    setIsLoading(true); 
    setCurrentLabel(label);
    fetch(`${API_BASE}/search`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(params || {}) 
    })
    .then(res => res.json())
    .then(json => { 
      if (json.status === "success") setSearchResults(json.data); 
    })
    .catch(err => { 
      console.error("搜尋出錯:", err); 
      alert("無法連線後端 API"); 
    })
    .finally(() => setIsLoading(false));
  };

  const openDrugDetailFromPatient = async (drugName) => {
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: drugName })
      });

      const json = await res.json();

      if (json.status === 'success' && json.data && json.data.length > 0) {
        setSelectedDrug(json.data[0]);
        setDrugDetailReturnView('dashboard');
        setView('drug_detail');
      } else {
        alert(`查無「${drugName}」的藥物詳細資料`);
      }
    } catch (err) {
      alert(`藥物查詢失敗：${err.message}`);
    }
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    const patientAdmissions = p.admissions || [];
    setAdmissions(patientAdmissions);
    
    if (patientAdmissions.length > 0) {
      const firstAdm = patientAdmissions[0];
      setCurrentAdm(firstAdm);
      setClinicalData(firstAdm.clinicalData || {
        trends: [],
        gantt: [],
        logs: []
      });
      if (firstAdm.admitRaw) {
        setDateStart(firstAdm.admitRaw.slice(0, 10));
      }
      if (firstAdm.dischargeRaw) {
        setDateEnd(firstAdm.dischargeRaw.slice(0, 10));
      }
    } else {
      setCurrentAdm(null);
      setClinicalData({
        trends: [],
        gantt: [],
        logs: []
      });
    }
    setStartIndex(0);
    setView('dashboard');
  };

  const filteredPatients = patients.filter((p) => {
  const keyword = patientSearchText.trim().toLowerCase();
  if (!keyword) return true;

  return (
    String(p.id || '').toLowerCase().includes(keyword) ||
    String(p.subject_id || '').toLowerCase().includes(keyword) ||
    String(p.name || '').toLowerCase().includes(keyword)
  );
});

const patientSuggestions = patientSearchText.trim()
  ? filteredPatients.slice(0, 8)
  : [];

  const formatAndReplaceText = (text) => {
    if (!text || String(text).toLowerCase() === 'nan') {
      return '<span class="text-slate-400 font-bold">無相關資料記載</span>';
    }

    let processed = String(text)
      .replace(/^Adverse Reactions\s*/i, '')
      .replace(/\(Ref\s*\)/gi, '')
      .replace(/:?style="[^"]*"\s*class="[^"]*">/gi, '')
      .replace(/style=.*?>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\[\s*link to .*?\]/gi, '');

    LAB_DICTIONARY.forEach(item => {
      const escapeRegExp = (string) =>
        string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const regex = new RegExp(escapeRegExp(item.term), 'gi');

      const colorClass =
        item.type === 'up'
          ? 'text-rose-700 bg-rose-100 border-rose-200'
          : 'text-blue-700 bg-blue-100 border-blue-200';

      const icon = item.type === 'up' ? '⬆' : '⬇';

      const replacement =
        `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded border font-black text-xs shadow-sm mx-1 align-text-bottom print-color-exact ${colorClass}">${item.label} ${icon}</span>`;

      processed = processed.replace(regex, replacement);
    });

    const sections = [
      "Frequency not defined",
      "Postmarketing and/or case reports",
      "Postmarketing",
      ">10%",
      "1% to 10%",
      "<1%",
      "≥10%"
    ];

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const secPattern = new RegExp(
      `(${sections.map(escapeRegExp).join('|')}):?`,
      'gi'
    );

    processed = processed.replace(
      secPattern,
      `<div class="mt-8 mb-3 p-3 bg-slate-50 border-l-4 border-blue-500 font-black text-slate-800 rounded-r shadow-sm text-lg print-color-exact">$1</div>`
    );

    const catPattern = new RegExp(
      `(${categories.map(escapeRegExp).join('|')}):`,
      'gi'
    );

    processed = processed.replace(
      catPattern,
      `<br><strong class="text-amber-900 bg-amber-100 px-2 py-1 rounded shadow-sm font-black mr-2 mt-3 mb-1 inline-block text-sm print-color-exact">$1:</strong>`
    );

    if (processed.startsWith('<br>')) {
      processed = processed.replace(/^(<br>)+/, '');
    }

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
      badges.forEach(b => { b.innerHTML = `[${b.innerText}]`; });
      
      return temp.innerText.trim();
    };
    
    if (rawAdverse && String(rawAdverse).toLowerCase() !== 'nan') textToCopy += `【不良反應】\n${convertHtmlToText(rawAdverse)}\n\n`;
    if (rawException && String(rawException).toLowerCase() !== 'nan') textToCopy += `【例外處理】\n${convertHtmlToText(rawException)}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowCopyToast(true); 
      setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

  const renderSidebar = () => {
    if (!isLoggedIn) return null;
    return (
      <div className="w-72 bg-white border-r border-slate-100 h-screen flex flex-col pt-8 pb-6 shadow-sm z-10 print:hidden">
        <div className="px-8 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">ADR PRO</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
          {!isPharmacist && (
            <>
              <button
                onClick={() => setView('overview')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                  view === 'overview' || view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
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

        <div className="mt-auto border-t border-slate-100 pt-6 px-4">
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
    if (!clinicalData || !currentAdm) {
      return <div className="p-12 text-slate-400 font-bold">載入中...</div>;
    }

    const safeClinicalData = clinicalData || { trends: [], gantt: [], logs: [] };
    const ionConfig = {
      Na: {
        key: 'na',
        statusKey: 'naStatus',
        label: 'Na',
        color: '#F97316',
        domain: [120, 160],
        normalMin: 135,
        normalMax: 145,
        unit: 'mmol/L'
      },
      K: {
        key: 'k',
        statusKey: 'kStatus',
        label: 'K',
        color: '#6366F1',
        domain: [2, 8],
        normalMin: 3.5,
        normalMax: 5.0,
        unit: 'mmol/L'
      }
    };

    const activeIons = selectedIons;
    const rangeStart = dateStart ? new Date(dateStart + 'T00:00:00') : null;
    const rangeEnd = dateEnd ? new Date(dateEnd + 'T23:59:59') : null;
    const filteredTrendsByDate = (safeClinicalData.trends || []).filter((item) => {
      if (!item.rawTime) return true;
      const t = new Date(item.rawTime);

      if (rangeStart && t < rangeStart) return false;
      if (rangeEnd && t > rangeEnd) return false;

      return true;
    });

    const shownDateSet = new Set();

    const visibleTrends = filteredTrendsByDate.map((item) => {
      const dayLabel = item.rawTime ? item.rawTime.slice(5, 10) : String(item.date).slice(0, 5);

      let xLabel = '';
      if (!shownDateSet.has(dayLabel)) {
        xLabel = dayLabel;
        shownDateSet.add(dayLabel);
      }

      return {
        ...item,
        timestamp: item.rawTime ? new Date(item.rawTime).getTime() : null,
        dateOnly: xLabel,
        fullTime: item.rawTime ? item.rawTime.replace('T', ' ').slice(0, 16) : item.date
      };
    });

    const timestamps = visibleTrends.map(x => x.timestamp).filter(Boolean);

    const timeMin = rangeStart
      ? rangeStart.getTime()
      : Math.min(...timestamps);

    const timeMax = rangeEnd
      ? rangeEnd.getTime()
      : Math.max(...timestamps);

    const formatDateTick = (value) => {
      const d = new Date(value);
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    };

    const dayTicks = [];
    if (rangeStart && rangeEnd) {
      const d = new Date(rangeStart);
      d.setHours(0, 0, 0, 0);

      while (d <= rangeEnd) {
        dayTicks.push(d.getTime());
        d.setDate(d.getDate() + 1);
      }
    }

    const CustomLabTooltip = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;

        const row = payload[0].payload;
        const fullTime = row.rawTime
          ? row.rawTime.replace('T', ' ').slice(0, 16)
          : row.date;

        return (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-sm">
            <p className="font-black text-slate-700 mb-2">檢驗時間：{fullTime}</p>

            {activeIons.map((ion) => {
              const cfg = ionConfig[ion];
              return (
                <p key={ion} className="font-bold" style={{ color: cfg.color }}>
                  {cfg.label}：{row[cfg.key] ?? '-'} {cfg.unit}
                </p>
              );
            })}
          </div>
        );
     };

    const abnormalLabs = [];

    filteredTrendsByDate.forEach((row) => {
      activeIons.forEach((ion) => {
        const cfg = ionConfig[ion];
        const value = row[cfg.key];
        const status = row[cfg.statusKey];

        if (value !== undefined && value !== null && (status === 'LOW' || status === 'HIGH')) {
          abnormalLabs.push({
            ion,
            value,
            status,
            time: row.rawTime ? row.rawTime.replace('T', ' ').slice(0, 16) : row.date,
            normalRange: `${cfg.normalMin}-${cfg.normalMax}`,
            unit: cfg.unit
          });
        }
      });
    });

    const allMeds =
      safeClinicalData.logs && safeClinicalData.logs.length > 0
        ? safeClinicalData.logs
        : (safeClinicalData.gantt || []);

    const filteredMeds = allMeds.filter((med) => {
    const medImpact = String(med.impact || '');

    const relatedToSelectedIon = activeIons.some((ion) => {
      return medImpact.includes(ion);
    });

    if (!relatedToSelectedIon) return false;

      if (!dateStart && !dateEnd) return true;
      if (!med.startRaw && !med.endRaw) return true;

      const medStart = med.startRaw ? new Date(med.startRaw) : null;
      const medEnd = med.endRaw ? new Date(med.endRaw) : medStart;

      const drugWindowStart = rangeStart
        ? new Date(rangeStart.getTime() - lookbackDays * 24 * 60 * 60 * 1000)
        : null;

      if (drugWindowStart && medEnd && medEnd < drugWindowStart) return false;
      if (rangeEnd && medStart && medStart > rangeEnd) return false;

      return true;
    });

    const getMedRelatedImpacts = (med) => {
    const impactText = String(med.impact || '');

      return activeIons
        .filter((ion) => impactText.includes(ion))
        .map((ion) => ion);
    };

    const getMedBarColor = (med) => {
      const relatedIons = getMedRelatedImpacts(med);

      if (relatedIons.length >= 2) {
        return '#5cf6dfff'; // 多離子影響：蒂芬妮藍
      }

      if (relatedIons.includes('Na')) {
        return '#F97316'; // Na：橘色
      }

      if (relatedIons.includes('K')) {
        return '#6366F1'; // K：藍紫色
      }

      return '#94A3B8';
    };

    const getMedPosition = (med) => {
      if (!rangeStart || !rangeEnd || !med.startRaw) {
        return { left: 0, width: 8 };
      }

      const total = rangeEnd.getTime() - rangeStart.getTime();
      const medStart = new Date(med.startRaw);
      const medEnd = med.endRaw ? new Date(med.endRaw) : medStart;

      const clippedStart = medStart < rangeStart ? rangeStart : medStart;
      const clippedEnd = medEnd > rangeEnd ? rangeEnd : medEnd;

      const left = Math.max(0, ((clippedStart.getTime() - rangeStart.getTime()) / total) * 100);
      const right = Math.min(100, ((clippedEnd.getTime() - rangeStart.getTime()) / total) * 100);
      const width = Math.max(6, right - left);

      return { left, width };
    };

    return (
      <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
        <div className="mb-6 bg-white rounded-3xl border border-slate-100 shadow-sm px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              Patient Profile
            </p>
            <h1 className="text-3xl font-black text-slate-800">
              {selectedPatient?.id}　{selectedPatient?.name}
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-2">
              {selectedPatient?.info}｜目前狀態：{selectedPatient?.status}
            </p>
          </div>

          <button
            onClick={() => setView('overview')}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-500 font-black hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            返回患者列表
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <button
              onClick={() => setIsAdmMenuOpen(!isAdmMenuOpen)}
              className="flex items-center gap-2 text-base lg:text-lg font-black text-slate-800 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              第 {admissions.findIndex(a => a.id === currentAdm.id) + 1} 次住院：{currentAdm?.date}
              <ChevronDown size={24} />
            </button>

            {isAdmMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden w-80">
                {admissions.map((adm, idx) => (
                  <div
                    key={adm.id}
                    onClick={() => {
                      setCurrentAdm(adm);
                      setClinicalData(adm.clinicalData || { trends: [], gantt: [], logs: [] });
                      if (adm.admitRaw) setDateStart(adm.admitRaw.slice(0, 10));
                      if (adm.dischargeRaw) setDateEnd(adm.dischargeRaw.slice(0, 10));
                      setStartIndex(0);
                      setIsAdmMenuOpen(false);
                    }}
                    className="px-5 py-3 hover:bg-blue-50 cursor-pointer font-bold border-b last:border-b-0 text-slate-600 text-sm"
                  >
                    第 {idx + 1} 次住院：{adm.date}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-xs font-black text-slate-400">檢驗區間</span>

            <input
              type="date"
              value={dateStart}
              min={currentAdm?.admitRaw?.slice(0, 10)}
              max={currentAdm?.dischargeRaw?.slice(0, 10)}
              onChange={(e) => {
                setDateStart(e.target.value);
                setStartIndex(0);
              }}
              className="outline-none text-sm font-bold text-slate-600"
            />

            <span className="text-slate-300 font-bold">至</span>

            <input
              type="date"
              value={dateEnd}
              min={currentAdm?.admitRaw?.slice(0, 10)}
              max={currentAdm?.dischargeRaw?.slice(0, 10)}
              onChange={(e) => {
                setDateEnd(e.target.value);
                setStartIndex(0);
              }}
              className="outline-none text-sm font-bold text-slate-600"
            />

            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="outline-none text-sm font-black text-blue-600 bg-blue-50 rounded-lg px-2 py-1"
            >
              <option value={3}>前 3 天用藥</option>
              <option value={7}>前 7 天用藥</option>
              <option value={14}>前 14 天用藥</option>
            </select>
<div className="relative border-l border-slate-200 pl-3">
  <button
    type="button"
    onClick={() => setShowIonMenu(prev => !prev)}
    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black"
  >
    離子值：{selectedIons.join(' / ')}
    <ChevronDown size={14} />
  </button>

  {showIonMenu && (
    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-3">
      {['Na', 'K'].map((ion) => (
        <label
          key={ion}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-black text-slate-600"
        >
          <input
            type="checkbox"
            checked={selectedIons.includes(ion)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIons(prev => prev.includes(ion) ? prev : [...prev, ion]);
              } else {
                setSelectedIons(prev => {
                  if (prev.length === 1) return prev;
                  return prev.filter(x => x !== ion);
                });
              }
            }}
          />
          {ionConfig[ion].label}
        </label>
      ))}

      <div className="border-t border-slate-100 mt-2 pt-2 px-3">
        <label className="flex items-center gap-3 py-2 cursor-pointer text-xs font-black text-slate-600">
          <input
            type="checkbox"
            checked={showDrugLabels}
            onChange={(e) => setShowDrugLabels(e.target.checked)}
          />
          顯示藥名
        </label>

        <p className="text-[10px] text-slate-400 font-bold mt-2">
          至少需選擇 1 個離子值
        </p>
      </div>
    </div>
  )}
</div>
        

            <label className="flex items-center gap-1 text-xs font-black text-slate-500">
              <input
                type="checkbox"
                checked={showNormalRange}
                onChange={(e) => setShowNormalRange(e.target.checked)}
              />
              顯示正常區間
            </label>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-8">
          <div className="h-80 w-full mb-8">
            <ResponsiveContainer>
              <LineChart data={visibleTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                {dayTicks.map((tick) => (
                <ReferenceLine
                  key={tick}
                  x={tick}
                  yAxisId={activeIons[0] === 'K' ? 'k' : 'na'}
                  stroke="#cbd5e196"
                  strokeOpacity={0.75}
                />
                ))}

                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={[timeMin, timeMax]}
                  scale="time"
                  ticks={dayTicks}
                  tickFormatter={formatDateTick}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}
                />

                {activeIons.map((ion, idx) => {
                  const cfg = ionConfig[ion];

                  return (
                    <YAxis
                      key={ion}
                      yAxisId={cfg.key}
                      orientation={idx === 0 ? 'left' : 'right'}
                      domain={cfg.domain}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: cfg.color, fontSize: 10, fontWeight: 'bold' }}
                      width={40}
                    />
                  );
                })}

                <Tooltip content={<CustomLabTooltip />} />

                {showNormalRange && activeIons.map((ion) => {
                  const cfg = ionConfig[ion];

                  return (
                    <ReferenceArea
                      key={`${ion}-range`}
                      yAxisId={cfg.key}
                      y1={cfg.normalMin}
                      y2={cfg.normalMax}
                      fill={cfg.color}
                      fillOpacity={0.05}
                      stroke="none"
                    >
                      <Label
                        value={`${cfg.label} 正常區間 (${cfg.normalMin}-${cfg.normalMax})`}
                        position="insideTopLeft"
                        fill={cfg.color}
                        fontSize={11}
                        fontWeight="bold"
                        opacity={0.6}
                      />
                    </ReferenceArea>
                  );
                })}

                {activeIons.map((ion) => {
                  const cfg = ionConfig[ion];

                  return (
                    <Line
                      key={ion}
                      yAxisId={cfg.key}
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={5}
                      dot={{ r: 6, fill: cfg.color, stroke: '#fff', strokeWidth: 3 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 pt-8 border-t border-slate-100">
            {filteredMeds.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold">
                此區間沒有用藥紀錄
              </div>
            ) : (
              filteredMeds.map((med, i) => {
                const pos = getMedPosition(med);

                return (
                  <div key={i} className="space-y-2">
                    <div className="mx-[40px] relative pt-4">

                      <div className="h-9 bg-slate-50 rounded-xl relative overflow-visible border border-slate-100 shadow-inner">
                        <div
                          className="absolute h-full rounded-md flex items-center group cursor-pointer overflow-visible"
                          style={{
                            left: `${pos.left}%`,
                            width: `${pos.width}%`,
                            backgroundColor: getMedBarColor(med)
                          }}
                        >
                        {showDrugLabels && (
                          <div className="absolute left-1 top-1 bottom-1 max-w-[70%] bg-white/60 backdrop-blur-sm border border-white/70 rounded-md px-3 flex items-center overflow-hidden">
                            <p className="text-[10px] font-black text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                              {med.name}
                            </p>
                          </div>
                        )}
                          <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-slate-900 text-white rounded-2xl shadow-xl p-4 text-left">
                            <p className="text-xs font-black mb-2">{med.name}</p>

                            <p className="text-[11px] text-slate-200 font-bold">
                              用藥時間：{med.startDate || med.start} ~ {med.endDate || med.end}
                            </p>

                            <p className="text-[11px] text-slate-200 font-bold mt-1">
                              可能影響：{med.impact || '未標示'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
          
        <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-rose-500" />
              <h2 className="text-rose-900 font-black italic text-xl uppercase tracking-tighter">
                異常檢驗值提醒
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-full">
                {abnormalLabs.length} 筆異常
              </span>

              <button
                onClick={() => setShowAbnormalPanel(prev => !prev)}
                className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200"
              >
                {showAbnormalPanel ? '收起' : '展開'}
              </button>
            </div>
          </div>

        {showAbnormalPanel && (
          abnormalLabs.length === 0 ? (
            <div className="text-slate-400 font-bold bg-slate-50 rounded-2xl p-6">
              目前選定區間內無過高或過低檢驗值。
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b text-left">
                <tr>
                  <th className="pb-4">檢驗項目</th>
                  <th className="pb-4">檢驗時間</th>
                  <th className="pb-4">檢驗值</th>
                  <th className="pb-4">正常範圍</th>
                  <th className="pb-4 text-right">判讀</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {abnormalLabs.map((lab, i) => (
                  <tr key={i} className="hover:bg-rose-50/40 transition-all">
                    <td className="py-5 font-black text-slate-700">{lab.ion}</td>
                    <td className="py-5 text-slate-500 font-mono">{lab.time}</td>
                    <td className="py-5 font-black text-rose-500">
                      {lab.value} {lab.unit}
                    </td>
                    <td className="py-5 text-slate-400 font-bold">
                      {lab.normalRange} {lab.unit}
                    </td>
                    <td className="py-5 text-right">
                      <span className={`px-4 py-2 rounded-full text-xs font-black border ${
                        lab.status === 'HIGH'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {lab.status === 'HIGH'
                          ? '偏高，建議通知主治醫師'
                          : '偏低，建議通知主治醫師'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="font-black text-slate-700 border-l-4 border-blue-600 pl-4 italic uppercase tracking-tighter">
            實際用藥全紀錄
          </h2>
          <span className="text-xs font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
            目前顯示 {filteredMeds.length} 種藥物
          </span>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-12">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b text-left">
              <tr>
                <th className="pb-4">藥物名稱</th>
                <th className="pb-4">用藥期間</th>
                <th className="pb-4">可能影響</th>
                <th className="pb-4 text-right">狀態</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filteredMeds.map((log, i) => (
                <React.Fragment key={i}>
                  <tr className="hover:bg-slate-50 transition-all">
                    <td className="py-6">
                      <button
                        onClick={() =>
                          setSelectedMedRecord(
                            selectedMedRecord?.name === log.name ? null : log
                          )
                        }
                        className="font-black italic text-blue-600 hover:underline"
                      >
                        {log.name}
                      </button>

                    </td>

                    <td className="py-6 text-slate-500 font-mono">
                      {log.start || log.startDate}
                      {' ~ '}
                      {log.end || log.endDate}
                    </td>

                    <td className="py-6">
                      {log.impact ? (
                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-200">
                          {log.impact}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">
                          未標示
                        </span>
                      )}
                    </td>

                    <td className="py-6 text-right">
                      <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full font-bold">
                        {log.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>

                  {selectedMedRecord?.name === log.name && (
                    <tr>
                      <td colSpan="4" className="pb-8">
                        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                          <div className="flex justify-between items-center mb-5">
                            <div>
                              <h3 className="text-xl font-black text-blue-900">
                                患者吃這個藥的紀錄：{log.name}
                              </h3>
                              <p className="text-xs font-bold text-blue-400 mt-1">
                                共 {log.administrations?.length || 0} 筆給藥/用藥紀錄
                              </p>
                            </div>

                            <button
                              onClick={() => setSelectedMedRecord(null)}
                              className="px-4 py-2 rounded-xl bg-white text-slate-500 font-black text-xs"
                            >
                              收起
                            </button>
                          </div>

                          <table className="w-full text-sm bg-white rounded-2xl overflow-hidden">
                            <thead className="bg-blue-100 text-blue-700 text-xs font-black">
                              <tr>
                                <th className="p-4 text-left">給藥時間</th>
                                <th className="p-4 text-left">藥物名稱</th>
                                <th className="p-4 text-left">對應標準藥名</th>
                                <th className="p-4 text-right">距離檢驗時間</th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-blue-50">
                              {(log.administrations || []).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="p-4 font-mono font-bold text-slate-600">
                                    {row.time}
                                  </td>
                                  <td className="p-4 font-black text-slate-700">
                                    {row.drug}
                                  </td>
                                  <td className="p-4 text-slate-500 font-bold">
                                    {row.mappedDrug}
                                  </td>
                                  <td className="p-4 text-right text-slate-400 font-bold">
                                    {row.hoursAfterDrug !== null && row.hoursAfterDrug !== undefined
                                      ? Number(row.hoursAfterDrug).toFixed(2)
                                      : '-'} hr
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-12 text-left print:shadow-none print:border-none print:p-0">
          <div className="bg-rose-50/50 p-6 -m-10 mb-10 rounded-t-3xl border-b border-rose-100 flex items-center gap-3 print:m-0 print:rounded-none">
            <AlertCircle className="text-rose-500" />
            <h2 className="text-rose-900 font-black italic text-xl uppercase tracking-tighter">
              ADR 關聯分析結論
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-8 text-left">臨床肇因藥物</th>
                <th className="p-8 text-left">影響維度</th>
                <th className="p-8 text-center">檢驗值變化</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMeds.map((med, i) => (
                <tr key={i} className="hover:bg-rose-50/30 transition-all">
                  <td className="p-8 font-black text-slate-700 italic">
                    <button
                      onClick={() => openDrugDetailFromPatient(med.name)}
                      className="text-blue-600 hover:underline font-black italic"
                    >
                      {med.name}
                    </button>
                    {med.level && med.level.includes('高') && (
                      <span className="bg-rose-100 text-rose-500 text-[8px] px-2 py-0.5 rounded font-black ml-2 uppercase italic">
                        Critical
                      </span>
                    )}
                  </td>

                  <td className="p-8 text-slate-400 font-bold uppercase">
                    Electrolyte
                  </td>

                  <td className="p-8 font-mono font-black text-2xl italic text-center text-rose-500">
                    {med.impact}
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
    <div className={`w-full flex flex-col items-center flex-1 overflow-y-auto px-8 transition-all ${searchResults.length > 0 ? "pt-8 bg-slate-50" : "pt-[20vh] bg-slate-50"}`}>
      <div className={`text-center transition-all w-full max-w-4xl ${searchResults.length > 0 ? "mb-8" : "mb-8"}`}>
        <h1 className={`font-black text-[#0f4c81] flex items-center justify-center gap-3 transition-all ${searchResults.length > 0 ? "text-2xl" : "text-4xl"}`}>
          <Search size={searchResults.length > 0 ? 28 : 40} /> 台北榮總藥物查詢
        </h1>
        {searchResults.length === 0 && <p className="text-slate-400 mt-3 font-bold tracking-widest">臨床專用搜尋引擎</p>}
        
        <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-4 shadow-lg mt-8 w-full max-w-3xl mx-auto focus-within:ring-4 focus-within:ring-blue-100 transition-all">
          <Search
            className="text-slate-400 mr-4 cursor-pointer hover:text-blue-600"
            size={24}
            onClick={() => performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery)}
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                performSearch({ keyword: searchQuery.trim() }, "搜尋：" + searchQuery);
              }
            }}
            className="flex-1 outline-none text-xl text-slate-800 bg-transparent font-bold"
            placeholder="搜尋藥名、藥碼或關鍵字..."
          />

          {searchQuery && (
            <X
              className="text-slate-400 cursor-pointer ml-3 hover:text-slate-600"
              size={24}
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            />
          )}
        </div>
        
        {searchResults.length === 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button onClick={() => performSearch({}, '完整收錄藥物')} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0f4c81] text-[#0f4c81] bg-white font-bold hover:bg-[#0f4c81] hover:text-white transition-all shadow-sm">
              <Database size={16} /> 收錄藥物 <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{stats.total}</span>
            </button>
            <button onClick={() => performSearch({ filter: 'reactions' }, '含不良反應資料庫')} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-600 text-rose-600 bg-white font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm">
              <AlertTriangle size={16} /> 不良反應藥物 <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs">{stats.with_reactions}</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowCategories(!showCategories)} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-600 text-emerald-600 bg-white font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                <Activity size={16} /> 身體反應分類
              </button>
              {showCategories && (
                <div className="absolute top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 grid grid-cols-1 gap-2 z-50 left-1/2 -translate-x-1/2">
                  {categories.map(sys => (
                    <span 
                      key={sys} 
                      onClick={() => { setSelectedCategory(sys); performSearch({ category: sys }, "分類：" + sys); setShowCategories(false); }} 
                      className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors text-left ${selectedCategory === sys ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
            <h2 className="font-black text-slate-700">顯示 {currentLabel}</h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">共 {searchResults.length} 筆</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white border-b text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <tr>
                <th className="py-5 px-6 w-32 text-center">藥碼</th>
                <th className="py-5 px-6">藥物名稱</th>
                <th className="py-5 px-6 w-40 text-center">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {searchResults.map((drug, i) => {
                const rawAdverse = drug['adverse reaction'] || drug.adverse_reaction;
                const hasReaction = rawAdverse && String(rawAdverse).toLowerCase() !== 'nan';
                return (
                  <tr key={i} className={`cursor-pointer hover:bg-blue-50/50 transition-all ${!hasReaction ? "bg-slate-50/30" : ""}`} onClick={() => {setSelectedDrug(drug);setDrugDetailReturnView('repository');setView('drug_detail');}}>
                    <td className="py-5 px-6 text-center font-mono font-bold text-slate-500">{drug.id || drug['drug id'] || '-'}</td>
                    <td className="py-5 px-6 font-black text-slate-800 text-lg">{drug.name}</td>
                    <td className="py-5 px-6 text-center">
                      {hasReaction 
                        ? <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-black border border-rose-200 inline-flex items-center gap-1"><AlertTriangle size={12}/> 注意不良反應</span>
                        : <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">無記載</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDrugManagement = () => {
    const filtered = drugMgmtList.filter(d =>
      String(d.name || '').toLowerCase().includes(drugMgmtSearch.toLowerCase()) ||
      String(d.id || d['drug id'] || '').toLowerCase().includes(drugMgmtSearch.toLowerCase())
    );
  
  const drugMgmtSuggestions = drugMgmtSearch.trim()
  ? filtered.slice(0, 8)
  : [];

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
      <button 
        onClick={() => setDrugMgmtTab(tab)}
        className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${drugMgmtTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
      >
        {label}
      </button>
    );

    return (
      <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">藥物管理</h1>
          <div className="flex gap-3">
            {drugMgmtTab === 'drugs' && (
              <>
                <label className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                  <Upload size={18} /> 匯入 JSON
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
                <button onClick={() => setShowAddDrug(!showAddDrug)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
                  <Plus size={18} /> 新增藥物
                </button>
              </>
            )}
            {drugMgmtTab === 'electrolyte' && (
              <button onClick={() => setShowAddEi(!showAddEi)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
                <Plus size={18} /> 新增影響紀錄
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 bg-slate-200/50 rounded-2xl p-1.5 mb-8 w-fit shadow-inner border border-slate-200">
          {btnTab('drugs', '藥物不良反應資料庫')}
          {btnTab('electrolyte', '電解質影響專區')}
        </div>

        {drugMgmtTab === 'drugs' && (() => {
          const fldCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
          return (
            <>
              {showAddDrug && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 mb-8 relative animate-fade-in">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl"></div>
                  <h3 className="font-black text-slate-700 mb-6 text-lg">新增藥物資料</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wide">藥物名稱 *</label>
                      <input type="text" className={fldCls} placeholder="e.g. Furosemide" value={newDrug.name} onChange={e => setNewDrug(p => ({...p, name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wide">藥碼</label>
                      <input type="text" className={fldCls} placeholder="（選填）" value={newDrug.id} onChange={e => setNewDrug(p => ({...p, id: e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wide">不良反應 (HTML 可)</label>
                      <textarea rows={4} className={fldCls + " resize-y"} placeholder="輸入不良反應內容（選填）" value={newDrug.adverse_reaction} onChange={e => setNewDrug(p => ({...p, adverse_reaction: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddDrug(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
                    <button onClick={handleAddDrug} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">確認新增</button>
                  </div>
                </div>
              )}

              {statusText && (
                <div className={`mb-6 flex items-center gap-2 px-5 py-4 rounded-xl font-bold text-sm border shadow-sm ${statusType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                  <AlertCircle size={18} /> {statusText}
                </div>
              )}
              
              <div className="relative mb-8 w-full max-w-3xl">
                <div className="flex items-center bg-white border border-slate-200 rounded-full px-6 py-4 shadow-md focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <Search className="text-slate-400 mr-4" size={22} />

                  <input
                    type="text"
                    value={drugMgmtSearch}
                    onChange={(e) => {
                      setDrugMgmtSearch(e.target.value);
                      setShowDrugMgmtSuggestions(true);
                    }}
                    onFocus={() => setShowDrugMgmtSuggestions(true)}
                    className="flex-1 outline-none text-lg text-slate-800 bg-transparent font-bold"
                    placeholder="搜尋藥物名稱或藥碼..."
                  />

                  {drugMgmtSearch && (
                    <X
                      className="text-slate-400 cursor-pointer ml-3 hover:text-slate-600"
                      size={22}
                      onClick={() => {
                        setDrugMgmtSearch('');
                        setShowDrugMgmtSuggestions(false);
                      }}
                    />
                  )}
                </div>

                {showDrugMgmtSuggestions && drugMgmtSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    {drugMgmtSuggestions.map((drug, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setDrugMgmtSearch(drug.name || '');
                          setSelectedDrug(drug);
                          setDrugDetailReturnView('drug_mgmt');
                          setView('drug_detail');
                          setShowDrugMgmtSuggestions(false);
                        }}
                        className="px-6 py-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-all border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-black text-slate-700">
                            {drug.name}
                          </p>

                          <p className="text-xs text-slate-400 font-bold">
                            藥碼：{drug.id || drug['drug id'] || '-'}
                          </p>
                        </div>

                        <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                          查看詳細
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-4 px-2">
                <p className="text-slate-500 font-bold text-sm">
                  共 <strong className="text-slate-800">{drugMgmtList.length}</strong> 筆
                  {drugMgmtSearch && <span className="text-blue-600 ml-2 bg-blue-50 px-2 py-1 rounded-md">篩選結果：{filtered.length} 筆</span>}
                </p>
              </div>

              {drugMgmtList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Pill size={64} className="mb-6 text-slate-200" />
                  <p className="font-black text-xl text-slate-400">尚未載入藥物資料</p>
                  <p className="text-sm mt-2 text-slate-400 font-bold">後端已連線時將自動載入，或點右上角新增 / 匯入 JSON</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
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
                          <tr
                            key={i}
                            onClick={() => {
                              setSelectedDrug(drug);
                              setDrugDetailReturnView('drug_mgmt');
                              setView('drug_detail');
                            }}
                            className="cursor-pointer hover:bg-blue-50/50 transition-all"
                          >
                            <td className="py-5 px-6 font-mono text-slate-400 font-bold text-sm text-center">{drug.id || drug['drug id'] || '—'}</td>
                            <td className="py-5 px-6 font-black text-slate-800 text-base">{drug.name}</td>
                            <td className="py-5 px-6 text-slate-500 font-medium text-sm max-w-[200px] truncate">{preview}</td>
                            <td className="py-5 px-6 text-center">
                              {hasRx ? <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-xs font-black border border-rose-200 whitespace-nowrap">有不良反應</span>
                                      : <span className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">無記載</span>}
                            </td>
                            <td className="py-5 px-6 text-center">
                              <button onClick={() => handleDeleteDrug(drug)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
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
                <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 mb-8 relative animate-fade-in">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl"></div>
                  <h3 className="font-black text-slate-700 mb-6 text-lg">新增電解質影響記錄</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">藥物名稱 *</label>
                      <input type="text" className={fldCls} placeholder="e.g. Furosemide" value={newEi.drug_name} onChange={e => setNewEi(p => ({...p, drug_name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">電解質</label>
                      <select className={fldCls} value={newEi.analyte} onChange={e => setNewEi(p => ({...p, analyte: e.target.value}))}>
                        <option value="K">K（鉀）</option>
                        <option value="Na">Na（鈉）</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">影響方向</label>
                      <select className={fldCls} value={newEi.impact_direction} onChange={e => setNewEi(p => ({...p, impact_direction: e.target.value}))}>
                        <option value="D">D — 降低 ↓</option>
                        <option value="E">E — 升高 ↑</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">備註</label>
                      <input type="text" className={fldCls} placeholder="（選填）" value={newEi.remarks} onChange={e => setNewEi(p => ({...p, remarks: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddEi(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
                    <button onClick={handleAddEi} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">確認新增</button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-48 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                  <Search size={18} className="text-slate-400 mr-2" />
                  <div className="flex items-center bg-white border border-slate-200 rounded-full px-5 py-3 shadow-sm w-full max-w-xl focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                    <Search className="text-slate-400 mr-3" size={20} />

                    <input
                      type="text"
                      value={eiKeyword}
                      onChange={(e) => setEiKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadEiData(eiAnalyte, eiDirection, e.target.value);
                      }}
                      className="flex-1 outline-none text-sm text-slate-700 bg-transparent font-bold"
                      placeholder="搜尋藥物名稱..."
                    />

                    {eiKeyword && (
                      <X
                        size={18}
                        className="text-slate-400 cursor-pointer"
                        onClick={() => {
                          setEiKeyword('');
                          loadEiData(eiAnalyte, eiDirection, '');
                        }}
                      />
                    )}
                  </div>
                </div>
                <select value={eiAnalyte} onChange={e => setEiAnalyte(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">全部電解質</option>
                  <option value="Na">Na（鈉）</option>
                  <option value="K">K（鉀）</option>
                </select>
                <select value={eiDirection} onChange={e => setEiDirection(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">全部方向</option>
                  <option value="D">D — 降低 ↓</option>
                  <option value="E">E — 升高 ↑</option>
                </select>
                <button onClick={applyEiFilter} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm">套用篩選</button>
                <button onClick={resetEiFilter} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">重設</button>
              </div>

              <p className="text-slate-500 font-bold text-sm mb-4 px-2">
                共 <strong className="text-slate-800">{eiList.length}</strong> 筆影響記錄
                <span className="text-blue-500 ml-3 font-medium bg-blue-50 px-2 py-1 rounded-md">💡 點選藥物名稱可查看關聯詳情</span>
              </p>

              {eiLoading ? (
                <div className="py-32 text-center text-slate-400 font-bold text-lg flex flex-col items-center gap-4">
                   <Activity className="animate-spin text-blue-500" size={32} /> 載入資料中...
                </div>
              ) : eiList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Activity size={64} className="mb-6 text-slate-200" />
                  <p className="font-black text-xl text-slate-400">無符合資料</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="py-5 px-6">藥物名稱</th>
                        <th className="py-5 px-6 text-center w-32">電解質</th>
                        <th className="py-5 px-6 text-center w-40">影響方向</th>
                        <th className="py-5 px-6">備註</th>
                        <th className="py-5 px-6 text-center w-28">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {eiList.map((row, i) => {
                        const isUp = row.impact_direction === 'E';
                        const isDown = row.impact_direction === 'D';
                        const eiKey = `${row.drug_name}|${row.analyte}|${row.impact_direction}`;
                        const inFldCls = "w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm";
                        
                        if (editingEiKey === eiKey) {
                          return (
                            <tr key={i} className="bg-blue-50/50">
                              <td className="py-4 px-6"><input className={inFldCls} value={editingEiData.drug_name} onChange={e => setEditingEiData(p => ({...p, drug_name: e.target.value}))} /></td>
                              <td className="py-4 px-6">
                                <select className={inFldCls} value={editingEiData.analyte} onChange={e => setEditingEiData(p => ({...p, analyte: e.target.value}))}>
                                  <option value="K">K (鉀)</option><option value="Na">Na (鈉)</option>
                                </select>
                              </td>
                              <td className="py-4 px-6">
                                <select className={inFldCls} value={editingEiData.impact_direction} onChange={e => setEditingEiData(p => ({...p, impact_direction: e.target.value}))}>
                                  <option value="D">↓ 降低</option><option value="E">↑ 升高</option>
                                </select>
                              </td>
                              <td className="py-4 px-6"><input className={inFldCls} value={editingEiData.remarks || ''} onChange={e => setEditingEiData(p => ({...p, remarks: e.target.value}))} /></td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={handleUpdateEi} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm">儲存</button>
                                  <button type="button" onClick={() => setEditingEiKey(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-300">取消</button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => openDrugModal(row.drug_name)}>
                            <td className="py-5 px-6 font-black text-blue-600 text-base group-hover:underline">{row.drug_name}</td>
                            <td className="py-5 px-6 text-center">
                              <span className={`px-4 py-1.5 rounded-full font-black text-sm border ${row.analyte === 'Na' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{row.analyte}</span>
                            </td>
                            <td className="py-5 px-6 text-center">
                              {isUp  && <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-1.5 rounded-full font-black text-sm"><AlertTriangle size={14}/> 升高</span>}
                              {isDown && <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-1.5 rounded-full font-black text-sm"><ArrowLeft className="-rotate-90" size={14}/> 降低</span>}
                              {!isUp && !isDown && <span className="text-slate-400 font-bold text-sm">{row.impact_direction}</span>}
                            </td>
                            <td className="py-5 px-6 text-slate-500 font-bold text-sm">{row.remarks || '—'}</td>
                            <td className="py-5 px-6 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingEiKey(eiKey); setEditingEiData({...row, orig_drug_name: row.drug_name, orig_analyte: row.analyte, orig_impact_direction: row.impact_direction}); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEi(row)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
    const inputCls = "w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm";
    
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
      <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">院內特徵值區間</h1>
          <button onClick={() => setShowAddRange(!showAddRange)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
            <Plus size={18} /> 新增項目
          </button>
        </div>

        {showAddRange && (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-lg p-8 mb-8 relative animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-3xl"></div>
            <h3 className="font-black text-slate-800 mb-6 text-xl">新增離子項目</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {addFields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} className={inputCls} placeholder={f.placeholder} value={newRange[f.key]} onChange={e => setNewRange(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddRange(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">取消</button>
              <button onClick={handleAdd} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md transition-all">確認新增</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {refRangesLoading && referenceRanges.length === 0 ? (
            <div className="py-32 text-center text-slate-400 font-bold text-lg flex flex-col items-center gap-4">
               <Activity className="animate-spin text-blue-500" size={32} /> 載入資料中...
            </div>
          ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <tr>
                <th className="py-5 px-6 text-center w-24">符號</th>
                <th className="py-5 px-6">中文名稱</th>
                <th className="py-5 px-6 text-center">單位</th>
                <th className="py-5 px-6 text-center">正常區間</th>
                <th className="py-5 px-6 text-center">危急低值</th>
                <th className="py-5 px-6 text-center">危急高值</th>
                <th className="py-5 px-6 text-center">最後更新</th>
                <th className="py-5 px-6 text-center w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referenceRanges.map(range => (
                <tr key={range.ion_type} className="hover:bg-slate-50 transition-all group">
                  {editingRangeId === range.ion_type ? (
                    <>
                      <td className="py-4 px-4 font-black text-blue-600 text-center text-lg bg-blue-50/50">{range.ion_type}</td>
                      <td className="py-4 px-4 bg-blue-50/50"><input className={inputCls} value={editingRangeData.chinese_name} onChange={e => setEditingRangeData(p => ({ ...p, chinese_name: e.target.value }))} /></td>
                      <td className="py-4 px-4 bg-blue-50/50"><input className={inputCls} value={editingRangeData.unit} onChange={e => setEditingRangeData(p => ({ ...p, unit: e.target.value }))} /></td>
                      <td className="py-4 px-4 bg-blue-50/50">
                        <div className="flex items-center gap-2">
                          <input type="number" className={inputCls} value={editingRangeData.normal_min} onChange={e => setEditingRangeData(p => ({ ...p, normal_min: e.target.value }))} />
                          <span className="text-slate-400 font-bold">–</span>
                          <input type="number" className={inputCls} value={editingRangeData.normal_max} onChange={e => setEditingRangeData(p => ({ ...p, normal_max: e.target.value }))} />
                        </div>
                      </td>
                      <td className="py-4 px-4 bg-blue-50/50"><input type="number" className={inputCls} value={editingRangeData.amr_min ?? ''} onChange={e => setEditingRangeData(p => ({ ...p, amr_min: e.target.value }))} /></td>
                      <td className="py-4 px-4 bg-blue-50/50"><input type="number" className={inputCls} value={editingRangeData.amr_max ?? ''} onChange={e => setEditingRangeData(p => ({ ...p, amr_max: e.target.value }))} /></td>
                      <td className="py-4 px-4 bg-blue-50/50 text-slate-300 text-xs text-center">—</td>
                      <td className="py-4 px-4 bg-blue-50/50 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm">儲存</button>
                          <button type="button" onClick={() => setEditingRangeId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-300">取消</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-6 px-6 font-black text-blue-600 text-center text-xl">{range.ion_type}</td>
                      <td className="py-6 px-6 font-black text-slate-800 text-base">{range.chinese_name || '—'}</td>
                      <td className="py-6 px-6 text-center font-mono font-bold text-slate-500">{range.unit}</td>
                      <td className="py-6 px-6 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full font-black text-sm border border-emerald-200">{range.normal_min} – {range.normal_max}</span>
                      </td>
                      <td className="py-6 px-6 text-center">
                        {range.amr_min != null ? <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-black text-sm border border-blue-200">&lt; {range.amr_min}</span> : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      <td className="py-6 px-6 text-center">
                        {range.amr_max != null ? <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-black text-sm border border-rose-200">&gt; {range.amr_max}</span> : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      <td className="py-6 px-6 text-center text-xs text-slate-400 font-bold">{range.last_updated}</td>
                      <td className="py-6 px-6 text-center">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(range)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(range)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
    
    const filteredSuggestions = suggestionsList.filter(item => {
      if (suggestionFilter === 'PENDING') return item.status === '待確認';
      if (suggestionFilter === 'COMPLETED') return item.status === '已完成';
      if (suggestionFilter === 'REJECTED') return item.status === '已否定';
      return true;
    });

    return (
      <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">用藥修改建議</h1>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex gap-1">
               <button onClick={() => setSuggestionFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${suggestionFilter === 'ALL' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>全部</button>
               <button onClick={() => setSuggestionFilter('PENDING')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${suggestionFilter === 'PENDING' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>待確認</button>
               <button onClick={() => setSuggestionFilter('COMPLETED')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${suggestionFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>已完成</button>
            </div>
            {!isPharmacist && (
              <button onClick={() => setShowAddSuggestionModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
                <Plus size={18} /> 提出新建議
              </button>
            )}
          </div>
        </div>

        {!isPharmacist && showAddSuggestionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => setShowAddSuggestionModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 text-white p-6 font-black flex justify-between items-center">
                <h3 className="text-lg tracking-wide">提出藥物修正建議</h3>
                <button type="button" onClick={() => setShowAddSuggestionModal(false)} className="hover:text-gray-300 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleDocSubmit} className="p-8 space-y-6 text-left">
                <div>
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase tracking-wider">藥物名稱 *</label>
                  <input type="text" required placeholder="例如: Amiodarone" className={fldCls} value={suggestionForm.drug_name} onChange={e => setSuggestionForm({...suggestionForm, drug_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase tracking-wider">建議變更類型 *</label>
                  <select className={fldCls} value={suggestionForm.suggestion_type} onChange={e => setSuggestionForm({...suggestionForm, suggestion_type: e.target.value})}>
                    <option>新增不良反應</option>
                    <option>修改現有敘述</option>
                    <option>修正電解質影響</option>
                    <option>其他建議</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase tracking-wider">建議調整內容 *</label>
                  <textarea required rows="4" placeholder="請詳細說明需要更動或新增的警示內容敘述..." className={fldCls + " resize-none"} value={suggestionForm.content} onChange={e => setSuggestionForm({...suggestionForm, content: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase tracking-wider">臨床理由/佐證 (選填)</label>
                  <textarea rows="2" placeholder="例如：文獻指引、臨床真實病患反應..." className={fldCls + " resize-none"} value={suggestionForm.reason} onChange={e => setSuggestionForm({...suggestionForm, reason: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddSuggestionModal(false)} className="px-6 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">取消</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">提交同步</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <tr>
                <th className="py-5 px-8 w-1/4">藥物 / 提報醫護</th>
                <th className="py-5 px-8">修訂建議內容</th>
                <th className="py-5 px-8 text-center w-40">目前的狀態</th>
                {isPharmacist && <th className="py-5 px-8 text-center w-56">藥師審查操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSuggestions.length === 0 ? (
                <tr>
                  <td colSpan={isPharmacist ? 4 : 3} className="py-32 text-center text-slate-400 font-bold">
                    <ClipboardCheck size={64} className="mx-auto mb-6 opacity-30 text-slate-300" />
                    無符合條件之修訂建議紀錄
                  </td>
                </tr>
              ) : (
                filteredSuggestions.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-all">
                    <td className="py-8 px-8 align-top">
                      <div className="font-black text-slate-800 text-lg mb-1">{item.drug_name}</div>
                      <div className="text-xs text-blue-700 font-bold mt-2 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full w-fit">
                        {item.suggestion_type}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-4 leading-relaxed">
                        由 <span className="text-slate-600 border-b border-slate-300 pb-0.5">{item.doctor_name}</span><br/>於 {item.created_at} 提報
                      </div>
                    </td>
                    <td className="py-8 px-8 align-top max-w-md">
                      <div className="text-slate-700 font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {item.content}
                      </div>
                      {item.reason && (
                        <div className="text-sm text-slate-500 font-bold mt-3 ml-2 flex items-start gap-2">
                          <span className="text-blue-400">↳</span> <span>依據：{item.reason}</span>
                        </div>
                      )}
                      {item.pharmacist_remark && (
                        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 p-4 rounded-2xl mt-4 font-bold shadow-sm flex gap-3">
                           <AlertCircle className="shrink-0 mt-0.5" size={18}/>
                           <div>
                             <span className="block text-[10px] uppercase tracking-wider text-rose-500 mb-1">藥師審查意見</span>
                             {item.pharmacist_remark}
                           </div>
                        </div>
                      )}
                    </td>
                    <td className="py-8 px-8 text-center align-top">
                      <span className={`px-5 py-2 rounded-full text-xs font-black border tracking-wider shadow-sm inline-block ${
                        item.status === '已完成' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === '已否定' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {isPharmacist && (
                      <td className="py-8 px-8 text-center align-top">
                        <div className="flex flex-col gap-3 items-center justify-center">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handlePharmaUpdate(item.id, '已完成')} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all border border-emerald-700">完成</button>
                            <button type="button" onClick={() => handlePharmaUpdate(item.id, '待確認')} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-sm transition-all border border-amber-600">重置</button>
                            <button type="button" onClick={() => { setActiveReviewId(item.id); setReviewRemark(item.pharmacist_remark || ''); }} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all border border-rose-700">否定</button>
                          </div>
                          {activeReviewId === item.id && (
                            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left w-full shadow-inner animate-fade-in relative">
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 border-t border-l border-slate-200 rotate-45"></div>
                              <label className="text-xs font-black text-slate-500 block relative z-10">請註記否定原因：</label>
                              <input type="text" placeholder="例如：臨床指引記載不符..." className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 relative z-10" value={reviewRemark} onChange={e => setReviewRemark(e.target.value)} />
                              <button type="button" onClick={() => handlePharmaUpdate(item.id, '已否定', reviewRemark)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs rounded-xl font-black tracking-widest transition-all relative z-10 shadow-sm">確認送出意見</button>
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
    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all";
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-12 relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6">
              <Activity size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 text-center tracking-tight leading-snug">
              台北榮總<br/>藥物不良反應系統
            </h1>
            <p className="text-blue-600 font-black mt-3 tracking-[0.2em] text-sm uppercase bg-blue-50 px-4 py-1.5 rounded-full">ADR Pro System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-500 font-black mb-2 text-xs uppercase tracking-wider ml-1">帳號 Username</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="username" placeholder="請輸入院內帳號" className={inputCls} required />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 font-black mb-2 text-xs uppercase tracking-wider ml-1">密碼 Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" name="password" placeholder="請輸入密碼" className={inputCls} required />
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm font-bold">
                <AlertCircle size={18} /> {loginError}
              </div>
            )}
            <button type="submit" disabled={isLoginLoading} className="w-full bg-blue-600 text-white rounded-xl py-4 font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4">
              {isLoginLoading ? '驗證中...' : '登 入 系 統'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        /* ✨ 隱藏 Recharts 點擊圖表時自帶的 focus 黑邊/藍框 */
        .recharts-wrapper { outline: none !important; }
        .recharts-surface { outline: none !important; }

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
      `}} />

      {renderSidebar()}
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {view === 'overview' && (
          <div className="flex-1 p-12 overflow-y-auto print:overflow-visible print:p-0 bg-slate-50">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black text-slate-800 mb-8 border-b-4 border-blue-600 inline-block pb-2 tracking-tight print:hidden">患者住院紀錄監測</h1>
              {!isPharmacist && (
                <div className="relative max-w-xl mb-8 print:hidden">
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm focus-within:ring-4 focus-within:ring-blue-100">
                    <Search size={20} className="text-slate-400 mr-3" />
                    <input
                      type="text"
                      value={patientSearchText}
                      onChange={(e) => {
                        setPatientSearchText(e.target.value);
                        setShowPatientSuggestions(true);
                      }}
                      onFocus={() => setShowPatientSuggestions(true)}
                      placeholder="搜尋病患 ID 或病患名稱..."
                      className="flex-1 outline-none text-slate-700 font-bold bg-transparent"
                    />
                    {patientSearchText && (
                      <X
                        size={18}
                        className="text-slate-400 cursor-pointer"
                        onClick={() => {
                          setPatientSearchText('');
                          setShowPatientSuggestions(false);
                        }}
                      />
                    )}
                  </div>

    {showPatientSuggestions && patientSuggestions.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
        {patientSuggestions.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              handleSelectPatient(p);
              setPatientSearchText('');
              setShowPatientSuggestions(false);
            }}
            className="px-5 py-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
          >
            <div className="font-black text-slate-700">{p.name}</div>
            <div className="text-xs text-slate-400 font-bold">
              ID：{p.id}｜{p.info}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest print:bg-white print:text-black">
                    <tr>
                      <th className="py-6 px-8 w-32">病歷 ID</th>
                      <th className="py-6 px-8">病患</th>
                      <th className="py-6 px-8 text-center w-40">Na+ / K+</th>
                      <th className="py-6 px-8 text-right pr-12 w-48">監測狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPatients.map((p) => {

                      let statusColor = "bg-slate-100 text-slate-500 border-slate-200";

                      if ((p.status || '').includes('危急') || (p.status || '').includes('高')) {
                        statusColor = "bg-rose-50 text-rose-700 border-rose-200 shadow-sm";
                      }
                      else if ((p.status || '').includes('觀察') || p.status.includes('中')) {
                        statusColor = "bg-amber-50 text-amber-700 border-amber-200 shadow-sm";
                      }
                      else if ((p.status || '').includes('穩定') || (p.status || '').includes('低')) {
                        statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm";
                      }

                      return (

                        <tr
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="hover:bg-blue-50/50 cursor-pointer group transition-all"
                        >

                          <td className="py-6 px-8 font-black text-blue-600 text-lg">
                            {p.id}
                          </td>

                          <td className="py-6 px-8 text-slate-800 font-black text-lg">
                            {p.name}

                            <span className="text-slate-400 font-medium text-sm ml-2">
                              {p.info}
                            </span>
                          </td>

                          <td className="py-6 px-6 text-center font-black text-slate-600 font-mono text-sm whitespace-nowrap">
                            {p.na} / {p.k}
                          </td>

                          <td className="py-6 px-8 text-right pr-12">
                            <span className={`px-5 py-2 rounded-full text-xs font-black border tracking-wider print-color-exact inline-block ${statusColor}`}>
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
          </div>
        )}

        {view === 'dashboard' && renderDashboard()}
        {view === 'repository' && renderRepository()}
        {view === 'drug_mgmt' && renderDrugManagement()}
        {view === 'ref_ranges' && renderReferenceRanges()}
        {view === 'suggestions' && renderSuggestions()}

        {view === 'drug_detail' && selectedDrug && (() => {
          const rawAdverse =
            selectedDrug['adverse reaction'] || selectedDrug.adverse_reaction;

          const rawException =
            selectedDrug['exception handling'] || selectedDrug.exception_handling;

          return (
            <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative print:block print:h-auto print:bg-white print:overflow-visible print:p-0">

              <div className="sticky top-0 left-0 right-0 bg-white border-b-4 border-[#0f4c81] p-6 px-12 flex justify-between items-center z-[100] shadow-sm print:hidden">
                <button
                  onClick={() => setView(drugDetailReturnView)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all"
                >
                  <ChevronLeft size={18} />
                  {drugDetailReturnView === 'dashboard'
                    ? '返回病患檢測資料'
                    : '返回查詢'}
                </button>

                <h1 className="text-3xl font-black text-[#0f4c81] flex-1 text-center tracking-tight">
                  {selectedDrug.name}
                </h1>

                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-100 bg-blue-50 text-[#0f4c81] hover:bg-[#0f4c81] hover:text-white rounded-full font-bold transition-colors"
                  >
                    <Copy size={18} />
                    複製內容
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-colors"
                  >
                    <Printer size={18} />
                    列印
                  </button>
                </div>
              </div>

              <div className="hidden print:block mb-6 border-b-2 border-black pb-2 text-center mt-4">
                <h1 className="text-3xl font-black text-black">
                  {selectedDrug.name} - 藥物不良反應詳情
                </h1>
              </div>

              {showCopyToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[200] flex items-center gap-2 fade-in print:hidden">
                  <ClipboardCheck size={20} className="text-green-400" />
                  已複製到剪貼簿
                </div>
              )}

              <div className="max-w-5xl mx-auto p-12 print:p-0 print:m-0 print:max-w-none print:w-full overflow-hidden print:overflow-visible">

                <div className="bg-white rounded-2xl p-10 shadow-sm border-l-[6px] border-rose-600 mb-8 print:border-none print:shadow-none print-break-avoid print:mb-4 print:p-0">
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <h2 className="text-2xl font-black text-rose-600 flex items-center gap-3 print:text-black">
                      <AlertTriangle size={28} className="print:hidden" />
                      不良反應 Adverse Reactions
                    </h2>

                    <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      Drug ID：{selectedDrug.id || selectedDrug['drug id'] || '-'}
                    </span>
                  </div>

                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatAndReplaceText(rawAdverse)
                    }}
                  />
                </div>

                {rawException && String(rawException).toLowerCase() !== 'nan' && (
                  <div className="bg-white rounded-2xl p-10 shadow-sm border-l-[6px] border-blue-600 print:border-none print:shadow-none print-break-avoid print:p-0">
                    <h2 className="text-2xl font-black text-blue-600 mb-6 flex items-center gap-3 border-b pb-4 print:text-black print:border-black print:mb-2 print:pb-2">
                      <AlertCircle size={28} className="print:hidden" />
                      注意事項
                    </h2>

                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatAndReplaceText(rawException)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* Global Modals */}
      {showEiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowEiModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 border-b border-slate-200 p-6 px-8 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{eiModalDrug}</h2>
                <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-widest">電解質影響與不良反應摘要</p>
              </div>
              <button type="button" onClick={() => setShowEiModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-white flex-1">
              {eiModalLoading ? (
                <div className="py-20 flex flex-col items-center gap-4 text-slate-400 font-bold">
                  <Activity className="animate-spin text-blue-500" size={32} /> 載入中…
                </div>
              ) : (
                <>
                  <h3 className="font-black text-slate-700 text-lg mb-4 flex items-center gap-2 border-b pb-2">
                    <Activity size={20} className="text-blue-500" /> 電解質影響紀錄
                  </h3>
                  {eiModalData.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 font-bold mb-8 border border-slate-100">
                      無電解質影響記錄
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 mb-8">
                      {eiModalData.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full font-black text-sm border ${r.analyte === 'Na' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                              {r.analyte}
                            </span>
                            <span className="font-black text-slate-700">
                              {r.impact_direction === 'E' ? <span className="text-rose-600 flex items-center gap-1"><AlertTriangle size={16}/> 導致數值升高</span> : <span className="text-blue-600 flex items-center gap-1"><ArrowLeft size={16} className="-rotate-90"/> 導致數值降低</span>}
                            </span>
                          </div>
                          {r.remarks && <span className="text-sm font-bold text-slate-400">{r.remarks}</span>}
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
                        <h3 className="font-black text-slate-700 text-lg mb-4 flex items-center gap-2 border-b pb-2 mt-8">
                          <AlertCircle size={20} className="text-rose-500" /> 不良反應摘要預覽
                        </h3>
                        <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100 text-slate-600 text-sm leading-relaxed font-medium">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-6 animate-fade-in" onClick={closeConfirm}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">確認刪除</h3>
            <p className="text-slate-500 font-bold text-sm mb-8">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={closeConfirm} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all w-1/2">
                取消
              </button>
              <button type="button" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md w-1/2">
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;