### 「開始」啟動系統：開啟兩個不同的 PowerShell 視窗
視窗 A (Python 後端)
PowerShell
cd C:\Users\user\Desktop\chihyu\adrproject\api
python app.py
保持此視窗開啟，不要關閉。

視窗 B (畫面：React 前端)
PowerShell
cd C:\Users\user\Desktop\chihyu\adrproject
npm start
________________________________________________________________________________

### 「結束」存檔
在 VS Code 儲存程式碼後，為了安全備份（防止之後改壞），請在 PowerShell 執行：

PowerShell
1. 進入專案資料夾
cd C:\Users\user\Desktop\chihyu\adrproject

2. 把變更加入存檔清單
git add .

3. 寫下今天的進度摘要
git commit -m "完成：全真實數據串接、病歷日期聯動切換、列印功能修復"
