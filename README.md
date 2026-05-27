## 一、系統需求（第一次使用前確認）

| 項目 | 版本要求 | 確認方式 |
|------|----------|----------|
| Node.js | 16 以上 | `node -v` |
| Python | 3.9 以上 | `python --version` |
| PostgreSQL | 14 以上 | 開啟 pgAdmin 確認服務有在執行 |

---

## 二、PostgreSQL 連線設定

系統預設連線資訊如下（寫在 `api/app.py` 第 7 行）：

| 項目 | 值 |
|------|----|
| 主機 | localhost |
| 連接埠 | 5432 |
| 資料庫名稱 | postgres |
| 使用者 | 自己的 |
| 密碼 | 自己的|

> 不需要手動建表。第一次執行 `python app.py` 時，系統會自動建立所有需要的 Schema 與資料表。

---

## 三、啟動系統

每次使用需要開兩個終端機視窗。

### 終端機 A — 後端（Flask API）

```powershell
cd C:\Users\cindy\Downloads\adrproject-main\adrproject-main\api
.\venv\Scripts\Activate.ps1
python app.py
```

看到以下訊息代表成功：
```
[DB] Schema 與資料表確認完成
* Running on http://127.0.0.1:5000
```

> 保持此視窗開啟，不要關閉。

---

### 終端機 B — 前端（React 畫面）

```powershell
cd C:\Users\cindy\Downloads\adrproject-main\adrproject-main
npm start
```

瀏覽器會自動開啟 `http://localhost:3000`

---

## 四、新增院內帳號

第一次使用前，需要在 PostgreSQL 新增醫事人員帳號。  
用 pgAdmin 開啟 Query Tool，執行：

```sql
INSERT INTO hosp.doctor_accounts (username, password, full_name, role)
VALUES ('帳號', '密碼', '姓名', '醫師');
```

`role` 可填：`醫師` / `藥師`

> 登入後畫面依 role 自動切換：
> 醫師：病患住院紀錄、藥物查詢
> 藥師：藥物管理、電解質影響、檢驗值區間

---

## 五、關閉系統

1. 前端：在終端機 B 按 `Ctrl + C`
2. 後端：在終端機 A 按 `Ctrl + C`

---

## 六、儲存程式碼（git 備份）

修改程式碼後，在 VS Code 終端機執行：

```powershell
cd C:\Users\cindy\Downloads\adrproject-main\adrproject-main
git add .
git commit -m "說明這次改了什麼"
```

---

## 七、常見問題

**npm start 出現 port 錯誤**  
→ Port 3000 被佔用，關閉其他程式或重開電腦。

**python app.py 出現 ModuleNotFoundError**  
→ 忘記 activate venv，先執行 `.\venv\Scripts\Activate.ps1`

**登入失敗：帳號或密碼錯誤**  
→ 用 pgAdmin 確認 `hosp.doctor_accounts` 裡有該帳號，username / password 需完全相符（區分大小寫）。

**後端無法連接資料庫**  
→ 確認 PostgreSQL 服務有在執行，密碼與 `api/app.py` 第 7 行一致。
