# 藥物不良反應 Na/K 分析程式說明

## 一、程式整體目的

這支程式的目標是：**從大量藥物的「不良反應」描述文字中，自動找出哪些藥物會造成鈉（Na）或鉀（K）離子異常升高或下降。**

資料來源是透過爬蟲抓取的藥物資料庫，原始文字夾雜 HTML 標籤與 Excel 格式殘留，需要先清洗再比對。

---

## 二、程式流程總覽

```
抓取資料.xlsx (2498 筆藥物)
        │
        ▼
  [Cell 1] 讀取原始 Excel
        │
        ▼
  [Cell 2] 定義清洗 + 比對函數
     ├─ 移除 HTML 標籤
     ├─ 移除 _x000D_ 殘留碼
     └─ Regex 比對 Na/K 關鍵字
        │
        ▼
  [Cell 3] 執行轉換並輸出
     └─ Na_K_直接比對結果_已清理.xlsx (1257 筆，來自 357 種藥物)
        │
        ▼
  [Cell 5] 找出無異常的藥物
     └─ 無Na_K異常之原始資料.xlsx (1734 筆)
```

---

## 三、各 Cell 說明

### Cell 1｜載入套件與讀取原始資料

```python
df_source = pd.read_excel(file_path, sheet_name='工作表1')
```

- 使用 `pandas` 讀取 Excel 檔案，共 **2498 筆**藥物資料
- 每筆包含：`爬蟲名`（藥物名稱）、`ADVERSE REACTION`（不良反應描述文字）

---

### Cell 2｜定義資料清洗與 Na/K 比對函數

這是整個程式的核心。函數 `parse_adverse_reaction(text)` 做三件事：

**步驟 1：清洗文字**

| 問題 | 原因 | 處理方式 |
|------|------|----------|
| `<div class="...">` | 爬蟲抓到帶 HTML 格式的網頁 | `re.sub(r'<[^>]+>', ' ', ...)` 移除所有 HTML 標籤 |
| `_x000D_` | Excel 儲存換行符號的殘留編碼 | `re.sub(r'_x[0-9A-Fa-f]{4}_', ' ', ...)` 移除 |
| 大小寫不一致 | 文字來源不同格式不同 | `.lower()` 全轉小寫 |

**步驟 2：Regex 比對 Na/K 關鍵字**

| 方向 | 電解質 | 對應醫學術語 |
|------|--------|-------------|
| E（升高） | K | `hyperkalemia`、`increased potassium` |
| D（下降） | K | `hypokalemia`、`decreased potassium` |
| E（升高） | Na | `hypernatremia`、`increased sodium` |
| D（下降） | Na | `hyponatremia`、`decreased sodium` |

---

### Cell 3｜執行轉換並輸出

- 逐筆遍歷所有藥物，呼叫 `parse_adverse_reaction()` 取得結果
- 每筆比對結果輸出為一列，欄位包含：`record_type`、`drug_name`、`analyte`、`impact_direction`
- 共萃取出 **1257 筆有效紀錄**，輸出成 `Na_K_直接比對結果_已清理.xlsx`

範例輸出：

| drug_name | analyte | impact_direction |
|-----------|---------|-----------------|
| Acetazolamide | Na | D |
| Spironolactone | K | E |
| Allopurinol | Na | E |

---

### Cell 5｜找出無 Na/K 異常的藥物

- 讀取原始總表（2498 筆）與比對結果表（357 種異常藥物）
- 使用 `~` 反向過濾：保留**不在**異常清單中的藥物
- 共找出 **1734 筆**無相關異常的藥物，輸出成 `無Na_K異常之原始資料.xlsx`

---

## 四、輸出檔案對照

| 檔案名稱 | 內容 | 筆數 |
|---------|------|------|
| `抓取資料.xlsx` | 原始爬蟲資料（輸入） | 2498 |
| `Na_K_直接比對結果_已清理.xlsx` | 有 Na/K 異常的藥物及方向 | 1257 |
| `無Na_K異常之原始資料.xlsx` | 文字中找不到異常關鍵字的藥物 | 1734 |

---

## 五、技術問答 Q&A

---

### Q1：什麼是正規表達式（Regex）？程式中怎麼用？

**A：** 正規表達式是一種用來描述「文字樣式」的語法，可以快速在大量文字中找到符合條件的字串。

程式中的例子：

```python
re.sub(r'<[^>]+>', ' ', text)
```

- `<` → 比對左角括號
- `[^>]+` → 比對「不是 `>` 的任意字元，一個或多個」
- `>` → 比對右角括號
- 整體意思：找出所有 HTML 標籤，換成空白

```python
re.search(r'\b(hyperkalemia|increased (serum |blood )?potassium)\b', text)
```

- `\b` → 單字邊界（避免比對到 `hyperkalemia_xyz` 這種不相關詞）
- `(a|b)` → 比對 a 或 b 任一個
- `?` → 前面的群組出現 0 或 1 次（`serum ` 可有可無）

---

### Q2：`re.search()` 和 `re.match()` 有什麼差別？

**A：**

| 函數 | 比對範圍 | 適合情境 |
|------|----------|----------|
| `re.match()` | 只從字串**開頭**開始比對 | 驗證格式（如電話號碼格式） |
| `re.search()` | 掃描整個字串，找**任意位置**的符合 | 在長文中找關鍵字 ← 本程式使用這個 |

本程式用 `re.search()` 是正確選擇，因為關鍵字可能出現在不良反應描述的任何位置。

---

### Q3：`_x000D_` 是什麼？為什麼要清掉它？

**A：** `_x000D_` 是 Excel 在儲存時，把 Windows 換行符號（`\r`，ASCII 碼 `0x0D`）編碼成 XML 格式後留下的殘留字串。當你把網頁文字貼進 Excel 再讀出來，就可能看到它。

如果不清掉：
- 文字會被切斷，例如 `hypo_x000D_kalemia` 就比對不到 `hypokalemia`
- Regex 比對會失敗，導致漏掉真正的異常

---

### Q4：pandas 的 `~` 符號是什麼意思？

**A：** `~` 是 pandas 的**反向（NOT）運算子**，用在布林遮罩（Boolean Mask）上。

```python
# isin() 回傳：這筆資料「有沒有」在清單中 → True/False
mask = df_all['爬蟲名'].isin(abnormal_list)

# ~ 取反：選出「不在」清單中的資料
df_no_reaction = df_all[~mask]
```

相當於 SQL 的：`WHERE 爬蟲名 NOT IN (異常清單)`

---

### Q5：`set()` 和 `list()` 在這裡有什麼用途差異？

**A：**

函數 `parse_adverse_reaction()` 用 `results = set()` 收集結果，再 `return list(results)`。

為什麼先用 `set`？

- `set` 自動**去除重複**
- 同一個藥物若文字中出現多次 `hypokalemia`，只會記錄一次 `('K', 'D')`
- 避免同一藥物的同一種異常被重複計算

---

### Q6：爬蟲資料為什麼會夾帶 HTML？

**A：** 爬蟲（Web Scraper）在抓取網頁資料時，有兩種常見做法：

1. **只抓純文字**：解析 HTML DOM 後取出 `.text` 屬性
2. **直接存整段 HTML**：把 `innerHTML` 整個存進 Excel ← 本資料集用這種

原始資料出現 `<div class="field-label disp-in">` 這類標籤，代表當時爬蟲是直接把整段 HTML 存進去的，需要在分析前先做清洗。

---

### Q7：程式有沒有可能「漏掉」某些藥物的異常？

**A：** 有，這是這類**規則式（Rule-based）方法**的主要限制：

| 情境 | 例子 | 是否被偵測 |
|------|------|-----------|
| 使用標準術語 | `hypokalemia` | ✅ 有 |
| 縮寫或代號 | `↓K+`、`low K` | ❌ 沒有 |
| 繞句描述 | `patients may experience a fall in serum potassium levels` | ❌ 沒有 |
| 非英文 | 日文、中文描述 | ❌ 沒有 |

改善方向：可引入 NLP 模型（如 BioBERT）或擴充關鍵字清單來提升召回率（Recall）。

---

### Q8：`impact_direction` 的 E 和 D 代表什麼？命名依據是什麼？

**A：**

| 代碼 | 全稱 | 中文 |
|------|------|------|
| `E` | Elevation | 升高 |
| `D` | Decrease | 下降 |

這是醫療資料庫或藥物交互作用系統中的常見縮寫格式，用來標記電解質或檢驗值的變化方向，方便後續的資料庫匯入與查詢。

---

## 六、結語

這支程式本質上是一個 **ETL（Extract → Transform → Load）流程**：

- **Extract**：從 Excel 讀入爬蟲原始資料
- **Transform**：清洗 HTML/格式殘留，用 Regex 萃取醫學關鍵字
- **Load**：輸出整理好的 Excel 供後續使用

核心價值在於將非結構化的藥物說明書文字，轉換成可供資料庫查詢的結構化紀錄。
