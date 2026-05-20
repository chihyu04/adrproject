from flask import Flask, jsonify, request, make_response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import json, os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return make_response('', 200)

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"[FLASK ERROR] {type(e).__name__}: {e}")
    try:
        db.session.rollback()
    except Exception:
        pass
    return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# Database Models
# ==========================================
class Patient(db.Model):
    __tablename__ = 'patients'
    __table_args__ = {'schema': 'hosp'}
    patient_id = db.Column(db.Integer, primary_key=True)
    gender = db.Column(db.String(10))
    anchor_age = db.Column(db.Integer)

class DoctorAccount(db.Model):
    __tablename__ = 'doctor_accounts'
    __table_args__ = {'schema': 'hosp'}
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='醫師')

class RefIonRange(db.Model):
    __tablename__ = 'ref_ion_ranges'
    ion_type     = db.Column(db.String(20),  primary_key=True)
    chinese_name = db.Column(db.String(50))
    normal_min   = db.Column(db.Float)
    normal_max   = db.Column(db.Float)
    amr_min      = db.Column(db.Float)
    amr_max      = db.Column(db.Float)
    unit         = db.Column(db.String(20))
    last_updated = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "ion_type":     self.ion_type,
            "chinese_name": self.chinese_name or '',
            "normal_min":   self.normal_min,
            "normal_max":   self.normal_max,
            "amr_min":      self.amr_min,
            "amr_max":      self.amr_max,
            "unit":         self.unit or '',
            "last_updated": self.last_updated.strftime('%Y-%m-%d %H:%M') if self.last_updated else '',
        }

class DrugSuggestion(db.Model):
    __tablename__ = 'drug_suggestions'
    id = db.Column(db.Integer, primary_key=True)
    drug_name = db.Column(db.String(100), nullable=False)
    suggestion_type = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text)
    doctor_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='待確認')  # 待確認, 已完成, 已否定
    pharmacist_remark = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "drug_name": self.drug_name,
            "suggestion_type": self.suggestion_type,
            "content": self.content,
            "reason": self.reason or '',
            "doctor_name": self.doctor_name,
            "status": self.status,
            "pharmacist_remark": self.pharmacist_remark or '',
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        }

DRUG_JSON_PATH = r"C:\Users\user\Downloads\adrproject-2-confirm-dialog\adrproject-2-confirm-dialog\api\drug_adverse.json"

def load_drugs():
    if os.path.exists(DRUG_JSON_PATH):
        try:
            with open(DRUG_JSON_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"JSON 解析失敗: {e}")
    return []

def save_drugs(drugs):
    with open(DRUG_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(drugs, f, ensure_ascii=False, indent=2)

# ==========================================
# API Routes
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({"status": "error", "message": "請輸入帳號和密碼"}), 400

        user = DoctorAccount.query.filter_by(username=username, password=password).first()
        if user is None:
            return jsonify({"status": "error", "message": "帳號或密碼錯誤"}), 401

        return jsonify({"status": "success", "user": {"name": user.full_name, "role": user.role}})
    except Exception as e:
        return jsonify({"status": "error", "message": f"資料庫錯誤: {str(e)}"}), 500

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
        cat = req.get('category').lower()
        drugs = [d for d in drugs if cat in str(d.get('adverse reaction', d.get('adverse_reaction'))).lower()]
    elif req.get('keyword'):
        k = req.get('keyword').lower()
        drugs = [d for d in drugs if k in str(d.get('name', '')).lower() or k in str(d.get('id', d.get('drug id', ''))).lower()]
        
    return jsonify({"status": "success", "data": drugs})

@app.route('/api/electrolyte_impact', methods=['GET'])
def get_electrolyte_impact():
    from sqlalchemy import text
    analyte   = request.args.get('analyte',   '').strip()
    keyword   = request.args.get('keyword',   '').strip()
    direction = request.args.get('direction', '').strip().upper()

    sql = "SELECT record_type, drug_name, analyte, impact_direction, remarks, is_active FROM public.electrolyte_impact WHERE 1=1"
    params = {}
    if analyte:   sql += " AND analyte = :analyte"; params['analyte']   = analyte
    if direction: sql += " AND impact_direction = :direction"; params['direction'] = direction
    if keyword:   sql += " AND drug_name ILIKE :kw"; params['kw']        = f'%{keyword}%'
    sql += " ORDER BY drug_name, analyte"

    with db.engine.connect() as conn:
        result = conn.execute(text(sql), params)
        rows = [dict(r._mapping) for r in result]
    return jsonify({"status": "success", "data": rows, "total": len(rows)})

@app.route('/api/electrolyte_impact', methods=['POST'])
def add_electrolyte_impact():
    from sqlalchemy import text
    data = request.get_json(silent=True) or {}
    drug_name = data.get('drug_name', '').strip()
    analyte = data.get('analyte', '').strip()
    impact_direction = data.get('impact_direction', '').strip()
    remarks = data.get('remarks', '') or ''
    if not drug_name or not analyte or not impact_direction:
        return jsonify({"status": "error", "message": "drug_name、analyte、impact_direction 為必填"}), 400
    sql = text("""
        INSERT INTO public.electrolyte_impact (drug_name, analyte, impact_direction, remarks, is_active, record_type)
        VALUES (:drug_name, :analyte, :impact_direction, :remarks, true, 'manual')
        RETURNING drug_name, analyte, impact_direction, remarks, is_active, record_type
    """)
    with db.engine.begin() as conn:
        result = conn.execute(sql, {'drug_name': drug_name, 'analyte': analyte, 'impact_direction': impact_direction, 'remarks': remarks})
        row = dict(result.fetchone()._mapping)
    return jsonify({"status": "success", "data": row})

@app.route('/api/electrolyte_impact', methods=['PUT'])
def update_electrolyte_impact():
    from sqlalchemy import text
    data = request.get_json(silent=True) or {}
    orig_drug = data.get('orig_drug_name', '').strip()
    orig_analyte = data.get('orig_analyte', '').strip()
    orig_dir = data.get('orig_impact_direction', '').strip()
    updates = {k: data[k] for k in ('drug_name', 'analyte', 'impact_direction', 'remarks') if k in data}
    if not updates:
        return jsonify({"status": "error", "message": "無更新內容"}), 400
    set_clause = ', '.join([f"{k} = :{k}" for k in updates])
    params = {**updates, 'orig_drug': orig_drug, 'orig_analyte': orig_analyte, 'orig_dir': orig_dir}
    sql = text(f"""
        UPDATE public.electrolyte_impact SET {set_clause}
        WHERE drug_name = :orig_drug AND analyte = :orig_analyte AND impact_direction = :orig_dir
        RETURNING drug_name, analyte, impact_direction, remarks, is_active, record_type
    """)
    with db.engine.begin() as conn:
        result = conn.execute(sql, params)
        row = result.fetchone()
        if not row:
            return jsonify({"status": "error", "message": "找不到此記錄"}), 404
        row = dict(row._mapping)
    return jsonify({"status": "success", "data": row})

@app.route('/api/electrolyte_impact', methods=['DELETE'])
def delete_electrolyte_impact():
    from sqlalchemy import text
    data = request.get_json(silent=True) or {}
    drug_name = data.get('drug_name', '').strip()
    analyte = data.get('analyte', '').strip()
    impact_direction = data.get('impact_direction', '').strip()
    sql = text("DELETE FROM public.electrolyte_impact WHERE drug_name = :drug_name AND analyte = :analyte AND impact_direction = :impact_direction")
    with db.engine.begin() as conn:
        result = conn.execute(sql, {'drug_name': drug_name, 'analyte': analyte, 'impact_direction': impact_direction})
        if result.rowcount == 0:
            return jsonify({"status": "error", "message": "找不到此記錄"}), 404
    return jsonify({"status": "success", "message": "已刪除"})

@app.route('/api/drugs', methods=['POST'])
def add_drug():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"status": "error", "message": "藥物名稱為必填"}), 400
    drugs = load_drugs()
    if any(d.get('name', '') == name for d in drugs):
        return jsonify({"status": "error", "message": f"「{name}」已存在"}), 409
    new_drug = {
        "id": data.get('id', '').strip() or f"D{len(drugs)+1:04d}",
        "name": name,
        "adverse reaction": data.get('adverse_reaction', '') or '',
    }
    drugs.append(new_drug)
    save_drugs(drugs)
    return jsonify({"status": "success", "message": f"「{name}」新增成功", "data": new_drug})

@app.route('/api/drugs/<string:drug_name>', methods=['DELETE'])
def delete_drug(drug_name):
    drugs = load_drugs()
    original_len = len(drugs)
    drugs = [d for d in drugs if d.get('name', '') != drug_name]
    if len(drugs) == original_len:
        return jsonify({"status": "error", "message": "找不到此藥物"}), 404
    save_drugs(drugs)
    return jsonify({"status": "success", "message": f"「{drug_name}」已刪除"})

@app.route('/api/ref_ranges', methods=['GET'])
def get_ref_ranges():
    rows = RefIonRange.query.order_by(RefIonRange.ion_type).all()
    return jsonify({"status": "success", "data": [r.to_dict() for r in rows]})

@app.route('/api/ref_ranges', methods=['POST'])
def add_ref_range():
    data = request.get_json(silent=True) or {}
    ion_type = data.get('ion_type', '').strip().upper()
    if not ion_type:
        return jsonify({"status": "error", "message": "離子符號為必填"}), 400
    if db.session.get(RefIonRange, ion_type):
        return jsonify({"status": "error", "message": f"「{ion_type}」已存在"}), 409
    row = RefIonRange(
        ion_type=ion_type,
        chinese_name=data.get('chinese_name', ''),
        normal_min=data.get('normal_min'),
        normal_max=data.get('normal_max'),
        amr_min=data.get('amr_min'),
        amr_max=data.get('amr_max'),
        unit=data.get('unit', ''),
        last_updated=datetime.now(timezone.utc),
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"status": "success", "message": f"「{ion_type}」新增成功", "data": row.to_dict()})

@app.route('/api/ref_ranges/<ion_type>', methods=['PUT'])
def update_ref_range(ion_type):
    row = db.session.get(RefIonRange, ion_type.upper())
    if not row:
        return jsonify({"status": "error", "message": "找不到此項目"}), 404
    data = request.get_json(silent=True) or {}
    for field in ('chinese_name', 'normal_min', 'normal_max', 'amr_min', 'amr_max', 'unit'):
        if field in data:
             setattr(row, field, data[field])
    row.last_updated = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"status": "success", "message": f"「{ion_type}」更新成功", "data": row.to_dict()})

@app.route('/api/ref_ranges/<ion_type>', methods=['DELETE'])
def delete_ref_range(ion_type):
    row = db.session.get(RefIonRange, ion_type.upper())
    if not row:
        return jsonify({"status": "error", "message": "找不到此項目"}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({"status": "success", "message": f"「{ion_type}」已刪除"})

@app.route('/api/stats', methods=['GET'])
def get_stats(): 
    drugs = load_drugs()
    with_rx = len([d for d in drugs if (d.get('adverse reaction') or d.get('adverse_reaction')) and str(d.get('adverse reaction', d.get('adverse_reaction'))).lower() != 'nan'])
    return jsonify({"total": len(drugs), "with_reactions": with_rx})

# 🔥 這裡是你之前放錯位置的建議箱核心 API 路由！
@app.route('/api/suggestions', methods=['GET', 'POST'])
def handle_api_suggestions():
    if request.method == 'GET':
        try:
            rows = DrugSuggestion.query.order_by(DrugSuggestion.created_at.desc()).all()
            return jsonify({"status": "success", "data": [r.to_dict() for r in rows]})
        except Exception as e:
            return jsonify({"status": "error", "message": f"獲取失敗: {str(e)}"}), 500

    if request.method == 'POST':
        try:
            data = request.get_json(silent=True) or {}
            drug_name = data.get('drug_name', '').strip()
            suggestion_type = data.get('suggestion_type', '').strip()
            content = data.get('content', '').strip()
            reason = data.get('reason', '').strip()
            doctor_name = data.get('doctor_name', '未知醫師').strip()

            if not drug_name or not content or not suggestion_type:
                 return jsonify({"status": "error", "message": "藥物名稱、變更類型與建議內容為必填"}), 400

            new_row = DrugSuggestion(
                drug_name=drug_name,
                suggestion_type=suggestion_type,
                content=content,
                reason=reason,
                doctor_name=doctor_name,
                status='待確認'
            )
            db.session.add(new_row)
            db.session.commit()
            return jsonify({"status": "success", "message": "建議已成功同步", "data": new_row.to_dict()})
        except Exception as e:
            db.session.rollback()
            return jsonify({"status": "error", "message": f"寫入失敗: {str(e)}"}), 500

@app.route('/api/suggestions/<int:suggestion_id>', methods=['PUT'])
def update_suggestion_status(suggestion_id):
    row = db.session.get(DrugSuggestion, suggestion_id)
    if not row: return jsonify({"status": "error", "message": "找不到該筆紀錄"}), 404
    
    data = request.get_json(silent=True) or {}
    if 'status' in data: row.status = data['status']
    if 'pharmacist_remark' in data: row.pharmacist_remark = data['pharmacist_remark']
        
    db.session.commit()
    return jsonify({"status": "success", "data": row.to_dict()})


# ==========================================
# Database Initialization & Main
# ==========================================
def init_db():
    from sqlalchemy import text
    with app.app_context():
        with db.engine.begin() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS hosp"))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.electrolyte_impact (
                    id               SERIAL PRIMARY KEY,
                    record_type      VARCHAR(20),
                    drug_name        VARCHAR(100),
                    analyte          VARCHAR(20),
                    impact_direction VARCHAR(10),
                    remarks          TEXT,
                    is_active        BOOLEAN DEFAULT true
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.drug_suggestions (
                    id                SERIAL PRIMARY KEY,
                    drug_name         VARCHAR(100),
                    suggestion_type   VARCHAR(50),
                    content           TEXT,
                    reason            TEXT,
                    doctor_name       VARCHAR(100),
                    status            VARCHAR(20) DEFAULT '待確認',
                    pharmacist_remark TEXT,
                    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
        db.create_all()
    print("[DB] Schema 與所有資料表確認完成")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)