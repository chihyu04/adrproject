import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { Users, Pill, Activity, ArrowLeft, AlertCircle, Calendar, ChevronDown, Search } from 'lucide-react';
import './index.css';

// --- 數據定義 ---
const admissionHistory = [
  { id: 'ADM-001', date: '2026/09/10 - 09/30 (本次住院)' },
  { id: 'ADM-002', date: '2025/11/12 - 11/28' }
];

// 嚴格生成 09/10 - 09/30 數據
const fullData = Array.from({ length: 21 }, (_, i) => {
  const day = 10 + i;
  return {
    date: "09/" + day,
    na: 142 - (i * 0.7) + Math.sin(i * 0.8) * 2,
    k: 3.6 + (i * 0.11),
    index: i
  };
});

const medData = [
  { name: 'FUROSEMIDE (LASIX)', type: '利尿劑 (↓ Na)', startIdx: 0, endIdx: 15, color: '#F43F5E', impact: '138 -> 128', level: '高度相關' },
  { name: 'LISINOPRIL', type: 'ACEI (↑ K)', startIdx: 5, endIdx: 12, color: '#FB923C', impact: '3.5 -> 5.5', level: '中度相關' },
  { name: 'SPIRONOLACTONE', type: '保鉀利尿劑', startIdx: 2, endIdx: 18, color: '#94A3B8', impact: '3.6 -> 4.8', level: '無明顯相關' },
  { name: 'KCL', type: '電解質補充', startIdx: 8, endIdx: 20, color: '#64748B', impact: '3.8 -> 4.6', level: '預期內治療反應' },
  { name: 'ASPIRIN', type: '抗血小板', startIdx: 0, endIdx: 20, color: '#CBD5E1', impact: 'N/A', level: '無明顯相關' }
];

export default function App() {
  const [view, setView] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [windowSize, setWindowSize] = useState(7);
  const [startIndex, setStartIndex] = useState(0);

  // 滑動窗口計算
  const visibleData = useMemo(() => fullData.slice(startIndex, startIndex + windowSize), [startIndex, windowSize]);

  // --- 藥物查詢頁面 ---
  if (view === 'repository') {
    return (
      <div className="flex h-screen bg-[#F8FAFC] font-sans text-left">
        <div className="w-64 bg-white border-r p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-10 text-xl italic"><Activity /> ADR PRO</div>
          <button onClick={() => setView('overview')} className="flex items-center gap-3 p-4 text-slate-400 hover:bg-slate-50 rounded-2xl font-bold w-full mb-4 transition-all tracking-tighter"><Users size={18} /> 病人總覽</button>
          <button className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl font-bold w-full shadow-lg shadow-blue-100"><Pill size={18} /> 藥物查詢</button>
        </div>
        <div className="flex-1 p-16 text-center overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-black italic text-slate-800 mb-10 border-b-4 border-blue-600 inline-block px-4 uppercase tracking-tighter">Lexidrug Repository</h1>
            <div className="relative mb-12 shadow-2xl rounded-full bg-white overflow-hidden border">
              <Search className="absolute left-8 top-6 text-slate-300" size={24} />
              <input className="w-full p-7 pl-20 outline-none text-xl placeholder-slate-200" placeholder="Search Global Database..." />
            </div>
            {['ACETAMINOPHEN', 'FUROSEMIDE (LASIX)', 'LISINOPRIL'].map((drug, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 mb-4 flex justify-between items-center hover:border-blue-500 transition-all cursor-pointer shadow-sm">
                <div className="text-left font-black text-2xl italic text-slate-700 tracking-tight">{drug}</div>
                <div className="text-slate-200 text-xl">❯</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 臨床儀表板 ---
  if (view === 'dashboard') {
    return (
      <div className="flex h-screen bg-[#F8FAFC] font-sans text-left">
        <div className="w-64 bg-white border-r p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-10 text-xl italic"><Activity /> ADR PRO</div>
          <button onClick={() => setView('overview')} className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg w-full mb-4 tracking-tighter"><Users size={18} /> 病人總覽</button>
          <button onClick={() => setView('repository')} className="flex items-center gap-3 p-4 text-slate-400 hover:bg-slate-50 rounded-2xl font-bold w-full transition-all tracking-tighter"><Pill size={18} /> 藥物查詢</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('overview')} className="p-3 bg-white border rounded-xl hover:text-blue-600 shadow-sm transition-all"><ArrowLeft size={18} /></button>
              <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-sm font-bold text-slate-700 text-sm italic tracking-tight">
                {admissionHistory[0].date} <ChevronDown size={14} className="text-slate-300" />
              </div>
            </div>
            <div className="flex gap-2">
              {[3, 7, 14].map(d => (
                <button key={d} onClick={() => { setWindowSize(d); setStartIndex(0); }} className={windowSize === d ? "px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md" : "px-6 py-2 bg-white text-slate-400 border font-bold text-xs"}>{d}D</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm mb-8">
            <div className="h-72 w-full mb-6">
              <ResponsiveContainer>
                <LineChart data={visibleData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                  {/* 固定 Y 軸，不隨滑動改變 */}
                  <YAxis yAxisId="na" domain={[120, 160]} ticks={[120, 130, 140, 150, 160]} axisLine={false} tickLine={false} tick={{fill: '#F97316', fontSize: 10}} width={40} />
                  <YAxis yAxisId="k" orientation="right" domain={[2, 8]} ticks={[2, 4, 6, 8]} axisLine={false} tickLine={false} tick={{fill: '#6366F1', fontSize: 10}} width={40} />
                  
                  <Tooltip isAnimationActive={false} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                  
                  <ReferenceArea yAxisId="na" y1={135} y2={145} fill="#F97316" fillOpacity={0.05}>
                    <Label value="Na Range (135-145)" position="insideTopLeft" fill="#F97316" fontSize={8} fontWeight="bold" />
                  </ReferenceArea>
                  <ReferenceArea yAxisId="k" y1={3.5} y2={5.0} fill="#6366F1" fillOpacity={0.05}>
                    <Label value="K Range (3.5-5.0)" position="insideBottomRight" fill="#6366F1" fontSize={8} fontWeight="bold" />
                  </ReferenceArea>
                  
                  <Line yAxisId="na" type="monotone" dataKey="na" stroke="#F97316" strokeWidth={5} dot={{r: 6, fill: '#F97316', strokeWidth: 3, stroke: '#fff'}} isAnimationActive={false} />
                  <Line yAxisId="k" type="monotone" dataKey="k" stroke="#6366F1" strokeWidth={5} dot={{r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff'}} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="px-10 mb-12">
              <input type="range" min="0" max={21 - windowSize} value={startIndex} onChange={(e) => setStartIndex(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-[10px] font-black text-slate-300 mt-4 uppercase">
                <span>住院開始 (09/10)</span>
                <span className="text-blue-600 font-bold bg-blue-50 px-4 py-1 rounded-full border border-blue-100 italic">檢視日期: {visibleData[0].date} - {visibleData[windowSize-1].date}</span>
                <span>住院結束 (09/30)</span>
              </div>
            </div>

            {/* 甘特圖連動 */}
            <div className="space-y-4 pt-10 border-t border-slate-50">
              {medData.map((med, i) => {
                const barLeft = Math.max(0, ((med.startIdx - startIndex) / windowSize) * 100);
                const barRight = Math.min(100, ((med.endIdx - startIndex + 1) / windowSize) * 100);
                const width = Math.max(0, barRight - barLeft);
                
                return (
                  <div key={i} className="flex items-center">
                    <div className="w-48 text-left pr-4 leading-tight">
                      <p className="text-[11px] font-black text-slate-700 italic tracking-tighter">{med.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{med.type}</p>
                    </div>
                    <div className="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 shadow-inner">
                      {width > 0 && (
                        <div className="absolute h-full transition-all duration-100 opacity-80 rounded-lg flex items-center px-4 shadow-sm" style={{ left: barLeft + '%', width: width + '%', backgroundColor: med.color }}>
                          <span className="text-[8px] text-white font-black uppercase opacity-60">ACTIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 實際用藥明細 */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border p-10 mb-8 text-left">
             <div className="flex items-center gap-2 mb-8 font-black text-slate-700 italic border-l-4 border-blue-600 pl-4 uppercase">實際用藥全紀錄 (住院詳細明細)</div>
             <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b">
                  <tr><th className="pb-4">藥物名稱</th><th className="pb-4">開始給藥</th><th className="pb-4">停止給藥</th><th className="pb-4 text-center">劑量變動歷程</th><th className="pb-4 text-right">狀態</th></tr>
                </thead>
                <tbody className="divide-y">
                  {medData.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-all">
                      <td className="py-6 font-black italic text-slate-700 uppercase tracking-tighter">{log.name}</td>
                      <td className="py-6 text-slate-400 font-medium font-mono">09/10 08:00</td>
                      <td className="py-6 text-slate-400 font-medium font-mono">{log.endIdx < 20 ? '09/25 10:00' : '使用中'}</td>
                      <td className="py-6 font-bold text-slate-600 text-center">● 每日給藥一次</td>
                      <td className="py-6 text-right font-black uppercase text-[10px]"><span className={log.endIdx >= 20 ? "text-green-500" : "text-slate-300"}>{log.endIdx >= 20 ? 'Active' : 'Past'}</span></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          {/* ADR 關聯表 - 列出所有藥物 */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-12 text-left">
            <div className="bg-rose-50/50 p-8 border-b flex items-center gap-3"><AlertCircle className="text-rose-500" size={24} /><h2 className="text-rose-900 font-black italic text-xl uppercase tracking-tighter">ADR 關聯分析結果 (所有用藥)</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="p-8">臨床肇因藥物</th><th className="p-8">影響維度</th><th className="p-8 text-center tracking-tighter">檢驗值變化</th><th className="p-8 text-right">智慧判定結論</th></tr>
              </thead>
              <tbody className="divide-y">
                {medData.map((med, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all">
                    <td className="p-8 font-black text-slate-700 italic text-lg tracking-tighter">{med.name} {med.level.includes('高') && <span className="bg-rose-100 text-rose-500 text-[8px] px-2 py-1 rounded font-black ml-2 uppercase">Critical</span>}</td>
                    <td className="p-8 text-slate-400 font-bold tracking-tighter">{med.type}</td>
                    <td className="p-8 font-mono font-black text-2xl italic text-center text-rose-500">{med.impact}</td>
                    <td className="p-8 text-right font-black"><span className="px-10 py-4 rounded-3xl text-xs font-black uppercase text-white shadow-xl inline-block transition-transform active:scale-95" style={{ backgroundColor: med.level.includes('高') ? '#F43F5E' : med.level.includes('中') ? '#F97316' : '#94A3B8' }}>{med.level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans p-10 items-center justify-center text-left">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden p-16 text-center border border-slate-100">
        <h1 className="text-3xl font-black italic text-slate-800 mb-10 border-b-8 border-blue-600/10 w-fit pb-2 uppercase mx-auto tracking-tighter">Patient Admission Records</h1>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-300 text-[10px] font-black uppercase tracking-widest border-b">
            <tr><th className="p-8">病歷 ID</th><th className="p-8">病患姓名</th><th className="p-8 text-center">目前房號</th><th className="p-8 text-center">最新 Na+ / K+</th><th className="p-8 text-right pr-12 tracking-widest">狀態</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[{id:'P001', name:'王小明', info:'(男/68)', na:'128', k:'4.5', room:'802-1', status:'危急'}, {id:'P002', name:'李大同', info:'(男/72)', na:'138', k:'4.2', room:'805-2', status:'觀察中'}].map(p => (
              <tr key={p.id} onClick={() => { setSelectedPatient(p); setView('dashboard'); }} className="hover:bg-blue-50/50 transition-all cursor-pointer">
                <td className="p-8 font-black text-blue-600 text-lg tracking-tight">{p.id}</td>
                <td className="p-8 font-black text-slate-700 text-lg">{p.name} <span className="text-slate-300 font-medium text-sm tracking-normal">{p.info}</span></td>
                <td className="p-8 text-slate-500 font-bold text-center text-lg font-mono tracking-tighter">{p.room}</td>
                <td className="p-8 font-mono font-black text-2xl italic text-center tracking-tighter text-rose-500">
                  <span className="border-b-4 border-rose-100 pb-1">{p.na}</span> <span className="text-slate-200">/</span> <span className="text-slate-700">{p.k}</span>
                </td>
                <td className="p-8 text-right pr-12">
                  <span className={p.status === '危急' ? "bg-rose-50 text-rose-500 px-6 py-2 rounded-full text-xs font-black shadow-sm border border-rose-100" : "bg-orange-50 text-orange-500 px-6 py-2 rounded-full text-xs font-black shadow-sm border border-orange-100"}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}