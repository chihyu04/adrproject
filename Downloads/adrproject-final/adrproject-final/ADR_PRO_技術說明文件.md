# ADR PRO 系統 — 技術說明文件

> 台北榮總藥物不良反應監測系統  
> 技術棧：React 19 + Flask + PostgreSQL + Tailwind CSS

---

## 目錄

1. [系統定位與使用角色](#一系統定位與使用角色)
2. [技術棧總覽](#二技術棧總覽)
3. [專案結構](#三專案結構)
4. [資料庫設計](#四資料庫設計)
5. [前後端串接機制](#五前後端串接機制)
6. [API 端點總覽](#六api-端點總覽)
7. [使用情境與完整流程](#七使用情境與完整流程)
8. [CRUD 說明](#八crud-說明)
9. [核心演算法與技術特色](#九核心演算法與技術特色)
10. [系統 Q&A](#十系統-qa)

---

## 一、系統定位與使用角色

**ADR PRO（Adverse Drug Reaction Professional System）** 是一套針對住院患者電解質異常進行監測、並整合藥物不良反應知識庫的臨床輔助系統。資料來源為 MIMIC-IV（MIT 發布的去識別化重症 ICU 資料庫）。

### 使用角色對照表

| 角色 | 登入後預設頁面 | 可操作功能 |
|------|--------------|-----------|
| **醫師** | 患者住院紀錄 | 監測電解質趨勢、查詢藥物不良反應、提出用藥修改建議 |
| **藥師** | 藥物管理 | 維護藥物資料庫、管理電解質影響知識庫、設定檢驗值區間、審查醫師建議 |

---

## 二、技術棧總覽

| 分類 | 技術 | 說明 |
|------|------|------|
| 前端框架 | **React 19** | SPA（單頁應用），所有 UI 邏輯集中在 `src/app.js` |
| UI 樣式 | **Tailwind CSS 3** | Utility-first CSS，直接在 className 中寫樣式 |
| 圖表 | **Recharts 3** | 繪製 Na/K 電解質趨勢折線圖 |
| 圖示 | **Lucide-React** | SVG 圖示庫（Search、Trash2、Edit2 等） |
| 後端框架 | **Flask（Python）** | 輕量 REST API 伺服器，跑在 port 5000 |
| ORM | **Flask-SQLAlchemy** | 物件關聯對應，連接 PostgreSQL |
| 資料庫 | **PostgreSQL** | 多 Schema 設計，存放患者、藥物、分析資料 |
| 開發代理 | **http-proxy-middleware** | 將前端 `/api/*` 轉發到後端，解決跨域問題 |

> **有無第三方外部 API？**  
> **沒有**。系統所有 API 皆為自行建立的 Flask REST API，沒有呼叫 OpenAI、藥物資料庫或任何外部服務。前端使用瀏覽器原生 `fetch()` 函數溝通後端。

---

## 三、專案結構

```
adrproject-final/
├── api/
│   ├── app.py                  ← Flask 後端主程式（所有 API 路由）
│   ├── create_tables.py        ← 建立資料表腳本
│   ├── import_drug_json.py     ← 將 JSON 資料匯入 PostgreSQL
│   ├── drug_adverse.json       ← 本地藥物資料備份（180+ 筆）
│   ├── requirements.txt        ← Python 套件清單
│   └── start_server.bat        ← Windows 一鍵啟動後端
├── src/
│   ├── app.js                  ← React 前端（3500+ 行，單一 component）
│   ├── setupProxy.js           ← 開發環境代理設定
│   ├── index.js                ← React 進入點
│   └── index.css               ← 全域樣式
├── public/
│   └── index.html              ← HTML 進入點
├── package.json                ← 前端套件清單
├── tailwind.config.js          ← Tailwind 設定
└── postcss.config.js           ← PostCSS 設定
```

---

## 四、資料庫設計

系統使用 **多 Schema 分層** 管理不同用途的資料表：

```
PostgreSQL (mimic)
├── hosp schema
│   ├── patients            患者基本資料（subject_id, gender, anchor_age）
│   ├── admissions          住院紀錄（hadm_id, admittime, dischtime）
│   └── doctor_accounts     系統帳號（username, password, role）
│
├── analysis schema
│   └── demo_top200_v2      200 位患者的 ADR 分析結果（含電解質檢驗值、用藥紀錄）
│
├── reference schema
│   ├── drug_adverse_info   藥物不良反應知識庫（drug_name, adverse_reaction, exception_handling）
│   ├── electrolyte_impact  藥物對電解質影響的知識庫（drug_name, analyte, impact_direction）
│   └── ref_ion_ranges      電解質正常區間設定（ion_type, normal_min, normal_max, amr_min, amr_max）
│
└── public schema
    └── drug_suggestions    醫師提出的用藥修改建議（drug_name, content, status, pharmacist_remark）
```

### 關鍵 Model 定義

```python
# Flask-SQLAlchemy ORM 範例（api/app.py）

class RefIonRange(db.Model):
    __tablename__ = 'ref_ion_ranges'
    __table_args__ = {'schema': 'reference'}
    ion_type     = db.Column(db.String(20), primary_key=True)  # 主鍵（Na、K、Ca）
    chinese_name = db.Column(db.String(50))
    normal_min   = db.Column(db.Float)    # 正常下限
    normal_max   = db.Column(db.Float)    # 正常上限
    amr_min      = db.Column(db.Float)    # 危急低值（Alert / Mandatory Reporting）
    amr_max      = db.Column(db.Float)    # 危急高值
    unit         = db.Column(db.String(20))
    last_updated = db.Column(db.DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc))

class DrugSuggestion(db.Model):
    __tablename__ = 'drug_suggestions'    # 注意：此表在 public schema
    id               = db.Column(db.Integer, primary_key=True)
    drug_name        = db.Column(db.String(100), nullable=False)
    suggestion_type  = db.Column(db.String(50),  nullable=False)
    content          = db.Column(db.Text,         nullable=False)
    doctor_name      = db.Column(db.String(100),  nullable=False)
    status           = db.Column(db.String(20),   default='待確認')
    pharmacist_remark= db.Column(db.Text)
    created_at       = db.Column(db.DateTime(timezone=True),
                                 default=lambda: datetime.now(timezone.utc))
```

---

## 五、前後端串接機制

### 5.1 代理設定（解決跨域）

```
[瀏覽器 React, port 3000]
    │   fetch('/api/patients')   ← 相對路徑，不寫 localhost
    ▼
[setupProxy.js]  ← http-proxy-middleware
    │   轉發到 http://127.0.0.1:5000/api/patients
    ▼
[Flask API, port 5000]
    │   查詢 PostgreSQL → 回傳 JSON
    ▲
[setupProxy.js]  ← 把回應傳回瀏覽器
    ▲
[瀏覽器接到 JSON，更新畫面]
```

**setupProxy.js 完整內容：**

```js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
  }));
};
```

前端所有路徑都寫 `/api/...`（相對路徑），部署到正式環境時只需改代理目標，不需改任何前端程式碼。

### 5.2 後端的 CORS 處理

除了代理，後端也對每個 response 加入 CORS header，讓直接呼叫 API（如 Postman 或正式環境前端）也能運作：

```python
@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response
```

`@after_request` 是 Flask 的裝飾器，讓每個 route 的 response 都自動加上這些 headers。

### 5.3 前端發送請求的標準寫法

```js
// 前端 fetch 範例（新增電解質影響）
const API_BASE = "/api";  // 統一設定，整個系統只改這一行就能換環境

const res = await fetch(`${API_BASE}/electrolyte_impact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },   // 告訴後端這是 JSON
  body: JSON.stringify(newEi),                        // JS 物件 → JSON 字串
});

const j = await res.json();   // 解析回應 JSON（第二個 await）

if (j.status === 'success') {
  setEiList(prev => [...prev, j.data]);  // 更新 state，畫面自動重新渲染
}
```

### 5.4 後端回應格式統一規範

系統所有 API 回傳格式統一：

```json
// 成功
{ "status": "success", "data": [...], "message": "新增成功" }

// 失敗
{ "status": "error", "message": "找不到此記錄" }
```

前端統一檢查 `j.status === 'success'` 決定下一步。

---

## 六、API 端點總覽

| 路徑 | 方法 | 功能 | 資料來源 |
|------|------|------|---------|
| `/api/login` | POST | 帳號密碼驗證，回傳 name 和 role | `hosp.doctor_accounts` |
| `/api/patients` | GET | 取得所有患者 + 住院 + 檢驗 + 用藥（樹狀結構） | 三表 JOIN |
| `/api/search` | POST | 藥物關鍵字 / 分類篩選搜尋 | `reference.drug_adverse_info` |
| `/api/stats` | GET | 藥物總數 / 含不良反應數 | 本地 JSON |
| `/api/drugs` | POST | 新增藥物 | 本地 JSON |
| `/api/drugs/<name>` | PUT | 更新藥物不良反應文字 | `reference.drug_adverse_info` |
| `/api/drugs/<name>` | DELETE | 刪除藥物 | 本地 JSON |
| `/api/electrolyte_impact` | GET | 查詢電解質影響（支援 analyte/direction/keyword 篩選） | `reference.electrolyte_impact` |
| `/api/electrolyte_impact` | POST | 新增電解質影響 | `reference.electrolyte_impact` |
| `/api/electrolyte_impact` | PUT | 修改電解質影響 | `reference.electrolyte_impact` |
| `/api/electrolyte_impact` | DELETE | 刪除電解質影響 | `reference.electrolyte_impact` |
| `/api/ref_ranges` | GET | 取得所有電解質正常區間 | `reference.ref_ion_ranges` |
| `/api/ref_ranges` | POST | 新增離子區間 | `reference.ref_ion_ranges` |
| `/api/ref_ranges/<ion>` | PUT | 更新離子區間 | `reference.ref_ion_ranges` |
| `/api/ref_ranges/<ion>` | DELETE | 刪除離子區間 | `reference.ref_ion_ranges` |
| `/api/suggestions` | GET | 取得所有醫師建議 | `public.drug_suggestions` |
| `/api/suggestions` | POST | 醫師新增建議 | `public.drug_suggestions` |
| `/api/suggestions/<id>` | PUT | 藥師審查（更新 status 和 remark） | `public.drug_suggestions` |

---

## 七、使用情境與完整流程

### 情境 A：醫師監測患者電解質異常

**使用情境：** 醫師早上查房前，需要快速看哪些住院患者的鈉（Na）或鉀（K）值異常，並追蹤與用藥的關聯。

```
[Step 1] 醫師進入登入頁面，輸入帳號密碼
         ↓
         前端：handleLogin() 用 fetch POST /api/login { username, password }
         後端：查詢 hosp.doctor_accounts，比對帳號密碼
         回傳：{ status: "success", user: { name: "張志明", role: "醫師" } }
         ↓
         前端：setIsLoggedIn(true), setCurrentUser({name, role})
               role === '醫師' → setView('overview')

[Step 2] isLoggedIn 變成 true，useEffect 自動觸發
         ↓
         同時發送兩個請求：
         (A) fetch GET /api/patients
         (B) fetch GET /api/stats
         ↓
         後端 /api/patients：
           執行三表 JOIN（demo_top200_v2 + patients + admissions）
           在 Python 用 patient_map 字典聚合成樹狀結構
           回傳 200 位患者，每位包含 admissions → clinicalData → trends / logs
         ↓
         前端：setPatients(patientList)
               自動選第一位患者，設定日期區間 dateStart / dateEnd

[Step 3] 醫師在患者列表看到「鈉偏低」狀態的患者，點擊該列
         ↓
         handleSelectPatient(p)：
           更新 selectedPatient, admissions, currentAdm, clinicalData
           setView('dashboard')

[Step 4] Dashboard 頁面渲染：
         ↓
         Recharts LineChart 畫出 Na / K 趨勢折線圖（x 軸是時間戳）
         甘特圖區域：顯示每種藥物的用藥期間（彩色橫條）
         異常提醒表格：列出 LOW / HIGH 的所有異常值
         ADR 關聯結論表：列出可能影響電解質的藥物與方向

[Step 5] 醫師在「ADR 關聯分析結論」表點藥物名稱「Furosemide」
         ↓
         openDrugDetailFromPatient("Furosemide")
         fetch POST /api/search { keyword: "Furosemide" }
         後端查 reference.drug_adverse_info，回傳不良反應資料
         前端：setSelectedDrug(result)
               setDrugDetailReturnView('dashboard')  ← 記住從哪來
               setView('drug_detail')

[Step 6] Drug Detail 頁面：
         ↓
         formatAndReplaceText() 解析不良反應文字
         把 ">10%" 等段落轉成藍色標題區塊
         把 "increased serum potassium" 換成 K ⬆ 彩色 badge
         醫師可按「複製」複製全文，或「列印」輸出 PDF
         ↓
         按「返回病患檢測資料」→ view 回到 'dashboard'
```

---

### 情境 B：醫師提出用藥修改建議，藥師進行審查

**使用情境：** 醫師發現某藥的電解質影響標示有誤，希望通知藥師更正。

```
【醫師端】

[Step 1] 切換至「用藥修改建議」頁面
         useEffect 偵測 view === 'suggestions'
         自動呼叫 loadSuggestions()
         fetch GET /api/suggestions
         顯示所有歷史建議（含狀態：待確認 / 已完成 / 已否定）

[Step 2] 按「提出新建議」→ 彈出 Modal 表單
         填入：
           - 藥物名稱：Amiodarone
           - 建議類型：修正電解質影響
           - 建議內容：目前系統標示 K↑，應更正為 K↓（導致血鉀降低）
           - 臨床理由：根據 2023 某某文獻，Amiodarone 長期使用會導致低血鉀

[Step 3] 按「提交建議」→ handleDocSubmit()：
         fetch POST /api/suggestions {
           drug_name: "Amiodarone",
           suggestion_type: "修正電解質影響",
           content: "目前系統標示 K↑...",
           reason: "根據 2023...",
           doctor_name: "張志明"   ← 從 currentUser.name 取得
         }
         後端寫入 public.drug_suggestions，status 預設 '待確認'
         前端關閉 Modal，重新呼叫 loadSuggestions() 刷新列表

【藥師端】

[Step 4] 藥師切換到「用藥變更建議審查」頁面
         看到狀態「待確認」的 Amiodarone 建議

[Step 5] 藥師確認後，點「否定」按鈕（或「完成」）
         若選否定：展開備註輸入框，填入「根據藥典，Amiodarone 實際上升鉀」
         按「確認送出意見」

[Step 6] handlePharmaUpdate(item.id, '已否定', reviewRemark)：
         fetch PUT /api/suggestions/47 {
           status: "已否定",
           pharmacist_remark: "根據藥典，Amiodarone 實際上升鉀..."
         }
         後端更新 status 和 pharmacist_remark 欄位
         前端重新 loadSuggestions()

[Step 7] 醫師端也能看到藥師的否定原因（pharmacist_remark 欄位顯示在建議卡片下方）
```

---

### 情境 C：藥師維護電解質影響知識庫

**使用情境：** 藥師發現資料庫缺少一筆 Hydrochlorothiazide 導致低血鉀的記錄，需要補充進去。

```
[Step 1] 藥師登入 → 自動進入「藥物管理」頁面
         點「電解質影響專區」tab

[Step 2] useEffect 偵測 tab 切換，且 eiList.length === 0
         自動呼叫 loadEiData()
         fetch GET /api/electrolyte_impact
         後端執行 CTE 查詢（正規化所有不同寫法的 analyte / direction）
         前端 setEiList(j.data)，顯示完整清單

[Step 3] 藥師在搜尋框輸入 "Hydrochlorothiazide"，選擇 Na、方向「全部」
         按「套用篩選」
         fetch GET /api/electrolyte_impact?analyte=Na&keyword=Hydrochlorothiazide
         確認清單中缺少 K 降低的記錄

[Step 4] 按「新增影響紀錄」→ 展開表單
         填入：
           藥物名稱：Hydrochlorothiazide
           電解質：K
           影響方向：D — 降低 ↓
           備註：利尿劑導致低血鉀，需監測

[Step 5] 按「確認新增」→ handleAddEi()：
         fetch POST /api/electrolyte_impact {
           drug_name: "Hydrochlorothiazide",
           analyte: "K",
           impact_direction: "D",
           remarks: "利尿劑導致低血鉀..."
         }
         後端 INSERT + RETURNING，直接回傳新建立的那筆資料
         前端 setEiList(prev => [...prev, j.data])（不重新 fetch 整個清單）
```

---

### 情境 D：藥師設定並更新電解質正常區間

**使用情境：** 院內更新了 Na 的正常值上限，藥師需要在系統中調整。

```
[Step 1] 藥師切換到「檢驗值區間」頁面
         useEffect 偵測 view === 'ref_ranges' → loadRefRanges()
         fetch GET /api/ref_ranges
         後端：RefIonRange.query.order_by(RefIonRange.ion_type).all()
         顯示所有電解質的正常範圍和危急值

[Step 2] 藥師點 Na 那列的「鉛筆編輯」按鈕
         該列變成 inline 編輯模式，所有欄位變成 input

[Step 3] 藥師把 normal_max 從 145 改成 146，按「儲存」
         handleSave()：
         fetch PUT /api/ref_ranges/Na {
           chinese_name: "鈉",
           normal_min: 135,
           normal_max: 146,   ← 更新的值
           amr_min: 120, amr_max: 160,
           unit: "mmol/L"
         }
         後端：db.session.get(RefIonRange, 'Na') 取得 ORM 物件
               用 setattr 動態更新每個欄位
               row.last_updated = datetime.now(timezone.utc)
               db.session.commit()
               回傳 row.to_dict()

[Step 4] 前端：setReferenceRanges(prev => prev.map(r => r.ion_type === 'Na' ? json.data : r))
         Na 那列立即顯示新的 146，其他列不變
```

---

## 八、CRUD 說明

### 8.1 兩種 DB 操作方式對比

| 方式 | 用於哪些 API | 特點 |
|------|------------|------|
| **ORM（Flask-SQLAlchemy）** | ref_ranges、drug_suggestions、doctor_accounts | 用 Python 物件操作，不直接寫 SQL，有 Model 定義 |
| **原生 SQL（text()）** | electrolyte_impact、drug_adverse_info、patients | 手寫 SQL，彈性更高，適合複雜查詢（JOIN、CTE、GROUP BY） |

### 8.2 ORM 範例（ref_ranges 更新）

```python
# Read：主鍵直接查
row = db.session.get(RefIonRange, ion_type.upper())

# Update：動態設定屬性
for field in ('chinese_name', 'normal_min', 'normal_max', 'amr_min', 'amr_max', 'unit'):
    if field in data:
        setattr(row, field, data[field])   # 只更新有傳入的欄位
row.last_updated = datetime.now(timezone.utc)
db.session.commit()

# Delete
db.session.delete(row)
db.session.commit()
```

### 8.3 原生 SQL 範例（electrolyte_impact 新增）

```python
sql = text("""
    INSERT INTO reference.electrolyte_impact
        (drug_name, analyte, impact_direction, remarks, is_active, record_type)
    VALUES (:drug_name, :analyte, :impact_direction, :remarks, true, 'manual')
    RETURNING drug_name, analyte, impact_direction, remarks, is_active, record_type
""")
with db.engine.begin() as conn:   # 離開 with 自動 commit
    result = conn.execute(sql, {
        'drug_name': drug_name,
        'analyte': analyte,
        'impact_direction': impact_direction,
        'remarks': remarks
    })
    row = dict(result.fetchone()._mapping)  # RETURNING 直接拿到新資料
```

`RETURNING` 是 PostgreSQL 專屬語法：INSERT / UPDATE / DELETE 執行後直接回傳被影響的列，前端不需要再發一次 GET 請求。

### 8.4 動態 UPDATE（electrolyte_impact 修改）

修改電解質影響時，系統允許連藥物名稱本身都能被修改，所以必須用「原始值」定位、「新值」更新：

```python
# 前端傳入
{
  "orig_drug_name": "Furosemide",       # ← 用這三個找到要改的那一列
  "orig_analyte": "K",
  "orig_impact_direction": "D",
  "drug_name": "Furosemide (Lasix)",    # ← 這是新值
  "remarks": "更新後的備註"
}

# 後端動態組成 SET clause
updates = {k: data[k] for k in ('drug_name', 'analyte', 'impact_direction', 'remarks') if k in data}
set_clause = ', '.join([f"{k} = :{k}" for k in updates])
# 結果：set_clause = "drug_name = :drug_name, remarks = :remarks"

sql = text(f"""
    UPDATE reference.electrolyte_impact SET {set_clause}
    WHERE drug_name = :orig_drug AND analyte = :orig_analyte AND impact_direction = :orig_dir
    RETURNING ...
""")
```

---

## 九、核心演算法與技術特色

### 9.1 患者資料聚合（後端 Python 邏輯）

SQL JOIN 結果是扁平的（每列是一個完整組合），Python 端把它組裝成前端需要的樹狀結構：

```
SQL 扁平結果：
  subject_id=1, hadm_id=101, analyte=Na, valuenum=138, drug_name=Furosemide
  subject_id=1, hadm_id=101, analyte=K,  valuenum=3.8, drug_name=Furosemide
  subject_id=1, hadm_id=102, analyte=Na, valuenum=141, drug_name=Aspirin
  subject_id=2, hadm_id=201, analyte=K,  valuenum=4.1, drug_name=Metoprolol

Python 聚合後：
  患者 P1：
    └─ 住院 101：趨勢[{Na:138, K:3.8}], 藥物[Furosemide → K↓]
    └─ 住院 102：趨勢[{Na:141}], 藥物[Aspirin → ...]
  患者 P2：
    └─ 住院 201：趨勢[{K:4.1}], 藥物[Metoprolol → ...]
```

核心用一個字典 `patient_map` 逐列掃描，遇到新的 `subject_id` 就新增患者，遇到新的 `hadm_id` 就新增住院，`_drugMap` 用藥物名稱為 key 聚合多次給藥紀錄。

### 9.2 時間移位算法（shift_demo_time）

MIMIC 資料的年份可能在 2008–2019，直接顯示會讓使用者覺得是舊資料。系統把年份移到 2020–2026：

```python
def shift_demo_time(dt):
    new_year = dt.year
    while new_year > 2026:
        new_year -= 7   # 往前移 7 年
    while new_year < 2020:
        new_year += 7   # 往後移 7 年
    try:
        return dt.replace(year=new_year)
    except ValueError:
        return dt.replace(year=new_year, day=28)  # 處理 2/29 閏年問題
```

用 **7 的倍數**是因為公曆約每 28 年重複一次（因數 7），讓移位後的日期星期幾保持一致，資料看起來更自然。

### 9.3 不良反應文字解析（parseAdrToBlocks）

把資料庫中的純文字不良反應資料解析成結構化的區塊，供編輯介面使用：

```
原始文字：
  ">10%:
   Cardiovascular: Hypertension, Tachycardia
   Renal: Electrolyte imbalance
   1% to 10%:
   Nervous system: Dizziness, Headache"

解析後的 blocks 結構：
  [
    {
      frequency: ">10%",
      sections: [
        { category: "Cardiovascular", content: "Hypertension, Tachycardia" },
        { category: "Renal", content: "Electrolyte imbalance" }
      ]
    },
    {
      frequency: "1% to 10%",
      sections: [
        { category: "Nervous system", content: "Dizziness, Headache" }
      ]
    }
  ]
```

解析邏輯：先用 RegExp 找出 ">10% / 1% to 10% / <1% / Frequency not defined / Postmarketing" 等頻率標題，切出每個頻率段落；再用 categories 陣列（Cardiovascular、Renal、Nervous system 等 19 種）在段落內找子標題，切出每個身體系統的內容。

### 9.4 不良反應文字格式化（formatAndReplaceText）

把解析完的文字轉換成帶顏色的 HTML，用 `dangerouslySetInnerHTML` 注入畫面：

```
"increased serum potassium" → <span class="text-rose-700 bg-rose-100...">K ⬆</span>
"decreased serum sodium"    → <span class="text-blue-700 bg-blue-100...">Na ⬇</span>
">10%:"                     → <div class="border-l-4 border-blue-500...">大標題區塊</div>
"Cardiovascular:"           → <strong class="bg-amber-100...">Cardiovascular:</strong>
```

共有 16 個 LAB_DICTIONARY 詞條（ALT、AST、BUN、SCr、Na、K 等各自的升高/降低版本），用 RegExp 全文掃描替換。

### 9.5 甘特圖位置計算

每個藥物橫條的位置和寬度，根據住院日期範圍動態計算百分比：

```js
const getMedPosition = (med) => {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  const medStart = new Date(med.startRaw);
  const medEnd = med.endRaw ? new Date(med.endRaw) : medStart;

  // 裁剪：超出日期範圍的部分截掉
  const clippedStart = medStart < rangeStart ? rangeStart : medStart;
  const clippedEnd = medEnd > rangeEnd ? rangeEnd : medEnd;

  const left = ((clippedStart - rangeStart) / total) * 100;  // 左側偏移 %
  const right = ((clippedEnd - rangeStart) / total) * 100;
  const width = Math.max(6, right - left);  // 最小 6%，保證視覺可見

  return { left, width };
};
```

### 9.6 電解質影響的 CTE 正規化查詢

資料庫中 `impact_direction` 欄位可能有多種寫法（'E'、'up'、'增加'、'升高'），系統用 CTE 在查詢階段統一正規化：

```sql
WITH normalized AS (
    SELECT
        TRIM(drug_name) AS drug_name,
        CASE
            WHEN UPPER(TRIM(analyte)) IN ('NA', 'SODIUM') THEN 'Na'
            WHEN UPPER(TRIM(analyte)) IN ('K', 'POTASSIUM') THEN 'K'
            ELSE UPPER(TRIM(analyte))
        END AS analyte,
        CASE
            WHEN UPPER(TRIM(impact_direction)) IN ('E', 'UP', 'INCREASE', '上升', '升高') THEN 'E'
            WHEN UPPER(TRIM(impact_direction)) IN ('D', 'DOWN', 'DECREASE', '下降', '降低') THEN 'D'
            ELSE UPPER(TRIM(impact_direction))
        END AS impact_direction
    FROM reference.electrolyte_impact
)
SELECT drug_name, analyte, impact_direction,
       STRING_AGG(DISTINCT NULLIF(remarks, ''), '；') AS remarks
FROM normalized
GROUP BY drug_name, analyte, impact_direction
ORDER BY drug_name, analyte, impact_direction
```

---

## 十、系統 Q&A

---

**Q1：這個系統有做登入驗證嗎？如果沒有 token，怎麼知道使用者有沒有登入？**

A：系統用最簡單的「前端 state 記錄」做登入狀態管理。後端登入 API 只負責查帳號密碼是否正確，並回傳 `role`，不發 token、不設 session cookie。前端把 `{ name, role }` 存在 `currentUser` state，`isLoggedIn` state 設為 true。

這表示：如果直接在瀏覽器呼叫 `/api/patients`，後端不會擋，因為沒有驗證機制。這是這個系統的重要安全缺口——正式醫療系統應使用 JWT token 或 session-based auth，並在每個受保護的 API 端點驗證 token。

---

**Q2：醫師和藥師看到的頁面為什麼不同？系統如何控制？**

A：登入成功後，後端回傳的 `role` 欄位決定初始頁面：

```js
// 登入後判斷角色
setView(json.user.role === '藥師' ? 'drug_mgmt' : 'overview');

// 側邊欄只渲染有權限的按鈕
const isPharmacist = currentUser?.role === '藥師';

return (
  <nav>
    {!isPharmacist && <button>患者住院紀錄</button>}
    {isPharmacist && <button>藥物管理</button>}
    {isPharmacist && <button>檢驗值區間</button>}
  </nav>
);
```

另外有一個 `useEffect` 監控 `view` 的值，防止使用者透過直接修改 state（如開發者工具）進入無權限的頁面：

```js
useEffect(() => {
  const pharmacistViews = ['drug_mgmt', 'ref_ranges', 'repository', 'drug_detail', 'suggestions'];
  const doctorViews = ['overview', 'dashboard', 'repository', 'drug_detail', 'suggestions'];
  if (isPharmacist && !pharmacistViews.includes(view)) setView('drug_mgmt');
  if (!isPharmacist && !doctorViews.includes(view)) setView('overview');
}, [view, isPharmacist, isLoggedIn, currentUser]);
```

---

**Q3：為什麼患者資料已經在 useEffect 載入了，切換患者不需要再打 API？**

A：這是「全量載入（Load All Once）」策略。系統登入後把所有 200 位患者的完整資料（含住院、趨勢、藥物）一次全部載下來存在 `patients` state 中。切換患者只是從 state 中選不同的物件，完全不需要再打 API，速度極快。

代價是第一次載入時間較長，且 API 回傳的 JSON 資料量較大。如果患者量從 200 增加到 20000，這個策略就不適用，需要改成「點選患者時才 fetch 該患者詳細資料」（分頁載入）。

---

**Q4：系統資料是真實病患資料嗎？個資如何處理？**

A：不是真實病患。資料來自 **MIMIC-IV**（Medical Information Mart for Intensive Care），是 MIT 和 Beth Israel Deaconess Medical Center 合作發布的**去識別化**重症 ICU 資料集，供學術研究使用。

系統另外做了兩層去識別化處理：
1. **年份移位**：`shift_demo_time()` 把原始年份（可能是 2008–2019）移到 2020–2026，讓資料看起來是近期
2. **姓名假名化**：患者名字全部換成台灣常見姓名的靜態陣列，同一筆資料每次顯示都是同一個假名（用患者序號 `% 200` 分配，具有一致性）

---

**Q5：藥物資料同時存在 JSON 檔和 PostgreSQL，這樣設計有什麼問題？**

A：這是系統目前最明顯的架構問題，造成「雙來源不一致」：

| 操作 | 實際寫入哪裡 |
|------|------------|
| 新增藥物（POST /api/drugs） | 本地 JSON 檔 |
| 刪除藥物（DELETE /api/drugs） | 本地 JSON 檔 |
| 讀取藥物搜尋（POST /api/search） | PostgreSQL |
| 更新不良反應（PUT /api/drugs） | PostgreSQL |

這表示：在前端新增一個藥物，它會出現在「藥物統計（stats）」中（從 JSON 讀），但在「藥物搜尋」中找不到（因為 search 查 PostgreSQL）。`import_drug_json.py` 是把 JSON 同步進 DB 的工具，但需要手動執行，不是自動的。理想做法是統一到 PostgreSQL，廢棄 JSON 儲存。

---

**Q6：系統為什麼把前端所有程式碼放在一個 app.js，不拆成多個 component？**

A：這是「單一 state 樹」的設計選擇。整個系統有大量跨頁面共享的 state（selectedPatient、clinicalData、selectedDrug、currentUser 等），若拆成多個 component，就需要透過 props 傳遞或引入 Context/Redux 管理，對小型專案來說反而增加複雜度。

單一 component 的好處是：所有 state 都在同一個 scope，切換頁面時資料完全保留（例如從 drug_detail 返回 dashboard，患者選擇狀態不變）。

缺點是維護性差：3500+ 行的單一檔案，找特定邏輯需要大量滾動，不符合大型商業專案規範。

---

**Q7：`dangerouslySetInnerHTML` 會有資安問題嗎？**

A：**理論上有，實際風險取決於資料來源。** `dangerouslySetInnerHTML` 直接把字串當 HTML 注入 DOM，如果字串含有惡意腳本（`<script>alert('XSS')</script>`），就會執行，造成 XSS（跨站腳本攻擊）。

系統裡注入的是 `formatAndReplaceText()` 的輸出，而這個函數的輸入是從 PostgreSQL `drug_adverse_info` 讀出的不良反應文字。只要資料庫資料是可信的（不允許任意使用者寫入），風險就低。但如果未來開放外部使用者新增不良反應文字，就一定需要在注入前用 **DOMPurify** 過濾。

---

**Q8：Recharts 的折線圖是怎麼把時間當 X 軸的？**

A：Recharts 的 `XAxis` 支援 `type="number"` + `scale="time"` 模式，把時間戳（毫秒數）當數值型 X 軸：

```jsx
<XAxis
  dataKey="timestamp"       // data 中每個點的 timestamp 欄位
  type="number"             // 告訴 Recharts 這是數值（不是類別）
  domain={[timeMin, timeMax]}  // X 軸起終點
  scale="time"              // 用時間比例尺
  ticks={dayTicks}          // 指定每天零時作為刻度點
  tickFormatter={formatDateTick}  // 只顯示 MM/DD
/>
```

`visibleTrends` 中每個資料點的 `timestamp` 是用 `new Date(item.rawTime).getTime()` 轉成毫秒數，Recharts 根據這個值在 X 軸上精確定位，即使資料點不均勻分布（今天 3 個、明天 1 個），間距也會正確呈現。

---

**Q9：藥師查看某個藥的「電解質影響詳情」Modal 是怎麼做到的？**

A：這是 `openDrugModal()` 函數，特別之處在於它同時從兩個來源取資料，合併顯示：

```js
const openDrugModal = async (drugName) => {
  setEiModalDrug(drugName);
  setShowEiModal(true);
  setEiModalLoading(true);

  // 來源 1：電解質影響知識庫（打 API）
  const res = await fetch(`${API_BASE}/electrolyte_impact?keyword=${encodeURIComponent(drugName)}`);
  const j = await res.json();
  setEiModalData(j.data.filter(r => r.drug_name === drugName));  // 精確比對

  setEiModalLoading(false);
  // 來源 2：不良反應摘要（直接從 drugMgmtList state 找，不打 API）
  // ↓ 在 Modal render 時用 drugMgmtList.find(d => d.name === eiModalDrug) 取得
};
```

精確比對 `r.drug_name === drugName`（而非 LIKE）是因為 keyword 搜尋可能回傳多筆（如搜尋 "aspirin" 可能同時匹配 "Aspirin" 和 "Aspirin-Caffeine"），Modal 只想顯示完全符合的藥物。

---

**Q10：系統的列印功能是怎麼實作的？**

A：用瀏覽器原生 `window.print()`，搭配 Tailwind 的列印媒體查詢。在 `app.js` 的 `return` 最外層有嵌入 `<style>` 標籤，定義了詳細的 `@media print` 規則：

```css
@media print {
  .print\:hidden { display: none !important; }  /* 隱藏側邊欄和按鈕列 */
  .flex { display: block !important; }           /* 取消 flex 排版 */
  .h-screen { height: auto !important; }         /* 讓內容全部展開 */
  .overflow-y-auto { overflow: visible !important; } /* 讓捲軸消失，全文印出 */
  * { print-color-adjust: exact !important; }    /* 保留彩色背景和字色 */
}
```

藥物詳情頁面的「不良反應」卡片有 `print:border-none print:shadow-none` 等 class，讓列印時版面更乾淨。搭配 `window.print()` 觸發後，瀏覽器會根據這些 CSS 規則自動調整版面再列印或存成 PDF。

---

**Q11：多個 useEffect 同時觸發會有問題嗎？**

A：React 的 `useEffect` 本身是有序的——同一個 render cycle 中，多個 useEffect 會按照程式碼順序依次執行（但都是非同步的，不阻塞渲染）。這個系統的潛在問題是：

```js
// 這兩個 useEffect 都在 isLoggedIn 變化時觸發
useEffect(() => { fetchInitialData(); }, [isLoggedIn]);  // 載入患者資料
useEffect(() => { fetch('/api/search', ...) }, [isLoggedIn]);  // 載入藥物清單
```

兩個同時發送 fetch 請求是 OK 的（瀏覽器支援多個並發請求），反而更有效率。問題是如果先登出（isLoggedIn = false）後立即登入（isLoggedIn = true），舊的 fetch 可能在新的之後才回來（race condition），導致 state 被舊資料覆蓋。正式解法是在 useEffect 中使用 `AbortController` 取消前一個請求。

---

**Q12：系統有處理 API 請求失敗的情況嗎？**

A：有，但不完整。後端有全域錯誤處理：

```python
@app.errorhandler(Exception)
def handle_exception(e):
    db.session.rollback()      # 清除未完成的 transaction
    return jsonify({"status": "error", "message": str(e)}), 500
```

前端的錯誤處理分兩種情況：
- **明確失敗**（後端回 `status: error`）：系統會顯示錯誤訊息或 `alert()`
- **網路連線失敗**（fetch 拋出例外）：大部分地方用空的 `catch {}` 靜默忽略錯誤，使用者不會看到任何提示

這是需要改善的地方。正式系統應在 catch 中顯示友善的錯誤提示（如 Toast 通知），並提供重試機制，而不是靜默失敗。

---

**Q13：系統的 `confirmModal` 為什麼不用 `window.confirm()`？**

A：`window.confirm()` 是瀏覽器內建的確認對話框，有幾個問題：
1. 外觀無法自定義（不符合系統的設計風格）
2. 會阻塞 JS 執行緒（blocking call），現代前端框架不鼓勵使用
3. 部分瀏覽器在 iframe 內或特定設定下會禁用它

系統自行實作的 `confirmModal` 是全域 React state，控制一個覆蓋全螢幕的 Modal 元件，可以完整設計外觀，用 `onConfirm` callback 傳入確認後要執行的函數，所有刪除操作共用這一個 Modal。

---

**Q14：前端的「即時搜尋建議」是怎麼做到的？效能有考量嗎？**

A：有三處即時搜尋建議（患者搜尋、藥物搜尋、電解質影響搜尋），都是**前端過濾已載入的資料**，不是邊輸入邊打 API：

```js
// 藥物搜尋建議：過濾 drugAutoList（登入後就全部載下來）
const suggestions = drugAutoList
  .filter(drug =>
    String(drug.name).toLowerCase().includes(searchQuery.toLowerCase())
  )
  .slice(0, 8);  // 只顯示前 8 個
```

這樣做的前提是資料量不能太大——系統有幾百筆藥物資料，前端過濾毫秒級完成。若資料量達到萬筆，應改為 debounce（延遲觸發）+ 後端搜尋：

```js
// 應該要有的 debounce 寫法
const debouncedSearch = useCallback(debounce((keyword) => {
  fetch(`/api/search?q=${keyword}`)...
}, 300), []);
```

---

**Q15：如果要把這個系統部署到正式環境，需要改哪些東西？**

A：至少需要處理以下幾點：

| 項目 | 現況 | 正式環境需要 |
|------|------|------------|
| 密碼儲存 | 明文 | bcrypt hash |
| 登入驗證 | 前端 state | JWT token + 後端驗證 |
| 資料庫連線字串 | 寫死在程式碼 `"postgresql://postgres:123456@localhost"` | 環境變數（.env） |
| CORS 設定 | `Allow-Origin: *`（全開放） | 限定特定 domain |
| 錯誤處理 | 部分 `catch {}` 靜默 | 完整錯誤提示 UI |
| 雙來源資料 | JSON + PostgreSQL | 統一到 PostgreSQL |
| 前後端分離部署 | setupProxy（開發用） | Nginx 反向代理或雲端 API Gateway |
| HTTPS | 無 | 必須，醫療資料法規要求 |

---

*文件版本：2026-06-02*  
*系統名稱：ADR PRO — 台北榮總藥物不良反應監測系統*
