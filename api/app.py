from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Patient(db.Model):
    __tablename__ = 'patients'; __table_args__ = {'schema': 'hosp'}
    patient_id = db.Column(db.Integer, primary_key=True)
    gender = db.Column(db.String(10)); anchor_age = db.Column(db.Integer)

def load_drugs():
    path = r"C:\Users\user\Desktop\chihyu\adrproject\api\drug_adverse.json"
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"JSON 解析失敗: {e}")
    return []

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        patients = Patient.query.all()
        return jsonify({"status": "success", "data": [{
            "id": f"P{str(p.patient_id).zfill(3)}", "name": "資料庫病患", "info": f"({p.gender}/{p.anchor_age})", 
            "na": "141", "k": "4.4", "room": "801", "status": "ADR 監測中",
            "admissions": [
                {
                    "id": 1, "date": "2024/05/01 - 2024/05/11",
                    "clinicalData": {
                        "trends": [{"date": f"05/{i:02d}", "na": 138+(i%4), "k": 3.8+(i%3)*0.2} for i in range(1, 12)],
                        "gantt": [{"name": "Furosemide", "type": "Loop Diuretics", "startDate": "05/01", "endDate": "05/05", "startIdx": 0, "endIdx": 4, "color": "#F97316", "level": "高相關性", "impact": "Na↓"}],
                        "logs": [{"name": "Furosemide", "start": "05/01", "end": "05/05", "dose": ["20mg"], "status": "STOPPED"}]
                    }
                }
            ]
        } for p in patients]})
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search_drugs():
    req = request.get_json(silent=True) or {}
    drugs = load_drugs()
    
    if req.get('filter') == 'reactions':
        drugs = [d for d in drugs if (d.get('adverse reaction') or d.get('adverse_reaction')) and str(d.get('adverse reaction', d.get('adverse_reaction'))).lower() != 'nan']
    elif req.get('category'):
        # 🔥 核心修正：從 adverse reaction 的內文去尋找身體分類 (不分大小寫)
        cat = req.get('category').lower()
        drugs = [d for d in drugs if cat in str(d.get('adverse reaction', d.get('adverse_reaction'))).lower()]
    elif req.get('keyword'):
        k = req.get('keyword').lower()
        drugs = [d for d in drugs if k in str(d.get('name', '')).lower() or k in str(d.get('id', d.get('drug id', ''))).lower()]
        
    return jsonify({"status": "success", "data": drugs})

@app.route('/api/stats', methods=['GET'])
def get_stats(): 
    drugs = load_drugs()
    with_rx = len([d for d in drugs if (d.get('adverse reaction') or d.get('adverse_reaction')) and str(d.get('adverse reaction', d.get('adverse_reaction'))).lower() != 'nan'])
    return jsonify({"total": len(drugs), "with_reactions": with_rx})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
