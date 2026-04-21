import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DRUG_JSON = os.path.join(BASE_DIR, 'drug_adverse.json')

# --- 模擬臨床數據 (保留不變) ---
PATIENTS_DB = [
    {"id": "P001", "name": "王小明", "info": "(男/68)", "na": "128", "k": "4.5", "room": "802-1", "status": "危急"},
    {"id": "P002", "name": "李大同", "info": "(男/72)", "na": "138", "k": "4.2", "room": "805-2", "status": "觀察中"}
]

ADMISSIONS_DB = {
    "P001": [
        { "id": "ADM-001", "date": "2026/09/10 - 09/30 (本次住院)" },
        { "id": "ADM-002", "date": "2025/11/12 - 11/28 (過往紀錄)" }
    ]
}

CLINICAL_DATA = {
    "ADM-001": {
        "trends": [{"date": f"09/{10+i}", "na": 142 - i*0.8, "k": 3.6 + i*0.12} for i in range(21)],
        "gantt": [
            {"name": "FUROSEMIDE (LASIX)", "type": "Na+ Impact", "startIdx": 0, "endIdx": 15, "startDate": "09/10", "endDate": "09/25", "color": "#3B82F6", "impact": "138 -> 128", "level": "高度相關"},
            {"name": "LISINOPRIL", "type": "K+ Impact", "startIdx": 5, "endIdx": 12, "startDate": "09/15", "endDate": "09/22", "color": "#EF4444", "impact": "3.5 -> 5.5", "level": "中度相關"}
        ],
        "logs": [
            {"name": "FUROSEMIDE (LASIX)", "start": "09/10 08:00", "end": "09/25 10:00", "dose": ["40 mg IV q12h", "20 mg IV q12h (09/18 減量)"], "status": "PAST"},
            {"name": "SPIRONOLACTONE", "start": "09/15 08:00", "end": "使用中", "dose": ["25 mg PO QD"], "status": "ACTIVE"}
        ]
    },
    "ADM-002": {
        "trends": [{"date": f"11/{12+i}", "na": 136 + i*0.3, "k": 4.2 - i*0.05} for i in range(17)],
        "gantt": [{"name": "AMLODIPINE", "type": "BP Impact", "startIdx": 0, "endIdx": 16, "startDate": "11/12", "endDate": "11/28", "color": "#10B981", "impact": "150->125", "level": "治療中"}],
        "logs": [{"name": "AMLODIPINE", "start": "11/12", "end": "11/28", "dose": ["5mg"], "status": "PAST"}]
    }
}

# --- 核心修復：資料正規化 ---
def load_drugs():
    try:
        with open(DRUG_JSON, 'r', encoding='utf-8') as f: 
            raw_data = json.load(f)
            normalized = []
            for item in raw_data:
                # 統一欄位名稱，避免找不到資料
                normalized.append({
                    "id": item.get("id", item.get("drug id", "")),
                    "name": item.get("name", ""),
                    "adverse_reaction": item.get("adverse reaction", item.get("adverse_reaction", "")),
                    "exception_handling": item.get("exception handling", item.get("exception_handling", ""))
                })
            return normalized
    except Exception as e: 
        print("Error loading JSON:", e)
        return []

@app.route('/api/stats', methods=['GET'])
def get_stats():
    data = load_drugs()
    total = len(data)
    with_reactions = sum(1 for d in data if d.get('adverse_reaction') and str(d.get('adverse_reaction')).lower() != 'nan')
    return jsonify({"total": total, "with_reactions": with_reactions})

@app.route('/api/search', methods=['GET'])
def search_drugs():
    data = load_drugs()
    kw = request.args.get('keyword', '').lower()
    flt = request.args.get('filter', '')
    cat = request.args.get('category', '')
    
    results = data
    if flt == 'reactions': 
        results = [d for d in results if d.get('adverse_reaction') and str(d.get('adverse_reaction')).lower() != 'nan']
    if cat: 
        results = [d for d in results if cat.lower() in str(d.get('adverse_reaction', '')).lower()]
    if kw: 
        results = [d for d in results if kw in str(d.get('name', '')).lower() or kw in str(d.get('id', '')).lower()]
    
    return jsonify({"data": results[:1000]})

@app.route('/api/patients', methods=['GET'])
def get_patients(): return jsonify(PATIENTS_DB)

@app.route('/api/patients/<pid>/admissions', methods=['GET'])
def get_admissions(pid): return jsonify(ADMISSIONS_DB.get(pid, []))

@app.route('/api/admissions/<aid>/details', methods=['GET'])
def get_adm_details(aid): return jsonify(CLINICAL_DATA.get(aid, {}))

if __name__ == '__main__':
    app.run(debug=True, port=5000)