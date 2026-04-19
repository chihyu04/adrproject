import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# 啟用 CORS，允許 React (localhost:3000) 跨域請求資料
CORS(app)

# 設定 JSON 檔案的絕對路徑 (確保與 app.py 在同一資料夾)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, 'drug_adverse.json')

def load_data():
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"錯誤：找不到檔案 {JSON_PATH}。請確認 drug_adverse.json 是否放在 api 資料夾中。")
        return []

@app.route('/api/drugs/stats', methods=['GET'])
def get_stats():
    data = load_data()
    total = len(data)
    with_reactions = sum(1 for d in data if d.get('side_effects', {}).get('severity') in ['Severe', 'Moderate'])
    return jsonify({"total": total, "with_reactions": with_reactions})

@app.route('/api/drugs/systems', methods=['GET'])
def get_systems():
    data = load_data()
    systems = set()
    for d in data:
        sys = d.get('side_effects', {}).get('system')
        if sys:
            systems.add(sys)
    return jsonify(sorted(list(systems)))

@app.route('/api/drugs/search', methods=['GET'])
def search_drugs():
    data = load_data()
    query = request.args.get('q', '').lower()
    system_filter = request.args.get('system', '')

    results = []
    for d in data:
        match_query = False
        if query:
            # 搜尋藥名或代碼
            if query in d.get('name', '').lower() or query in d.get('id', '').lower():
                match_query = True
            # 搜尋適應症
            elif any(query in ind.lower() for ind in d.get('indications', [])):
                match_query = True
        else:
            match_query = True # 如果沒有搜尋字串，預設全抓 (配合分類過濾)

        match_system = True
        if system_filter:
            if d.get('side_effects', {}).get('system') != system_filter:
                match_system = False

        if match_query and match_system:
            results.append(d)

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)