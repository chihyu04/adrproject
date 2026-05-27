from flask import Flask, jsonify, request, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime, timezone
import json, os

app = Flask(__name__)
def shift_demo_time(dt):
    if not dt:
        return None

    new_year = dt.year

    # 太晚就往前移
    while new_year > 2026:
        new_year -= 7

    # 太早就往後移
    while new_year < 2020:
        new_year += 7

    try:
        return dt.replace(year=new_year)

    except ValueError:
        # 處理 2/29
        return dt.replace(year=new_year, day=28)
fake_names = [
    "王志明","李雅婷","陳冠宇","林怡君","張家豪","黃郁婷","吳承翰","蔡佩珊","劉柏廷","楊詩涵",
    "鄭宇翔","謝佳穎","洪子軒","許庭瑜","郭冠廷","曾婉婷","邱柏宇","蘇怡安","高子晴","何俊傑",
    "林家妤","陳柏翰","張雅雯","黃士豪","蔡佳蓉","楊承恩","劉品妤","鄭凱文","吳宜庭","謝宗翰",
    "洪郁晴","許博鈞","郭怡伶","曾柏霖","邱雅筑","蘇志豪","高鈺婷","何承澤","林書宇","陳詩婷",
    "張哲維","黃佩君","蔡政勳","楊雅玲","劉俊廷","鄭舒涵","吳柏叡","謝雅婷","洪柏安","許宥蓁",
    "郭哲宇","曾郁庭","邱俊豪","蘇佳穎","高柏鈞","何佩珊","林哲安","陳冠蓉","張承宇","黃雅晴",
    "蔡柏翰","楊子恩","劉詩涵","鄭俊宇","吳郁婷","謝柏豪","洪怡安","許哲維","郭佩蓉","曾書豪",
    "邱雅雯","蘇承恩","高佳穎","何柏廷","林郁涵","陳俊傑","張雅筑","黃冠宇","蔡怡婷","楊柏鈞",
    "劉哲豪","鄭佩君","吳書宇","謝子晴","洪承翰","許佳蓉","郭柏霖","曾哲維","邱佩珊","蘇俊廷",
    "高雅玲","何哲宇","林怡伶","陳承恩","張郁婷","黃哲安","蔡雅晴","楊冠廷","劉佳穎","鄭柏宇",
    "吳詩涵","謝俊豪","洪佩蓉","許雅筑","郭承澤","曾柏翰","邱郁庭","蘇哲維","高佩君","何雅婷",
    "林俊宇","陳佳蓉","張柏廷","黃郁涵","蔡哲豪","楊佩珊","劉雅雯","鄭哲安","吳佳穎","謝柏鈞",
    "洪哲宇","許佩君","郭雅玲","曾承恩","邱佳婷","蘇柏霖","高哲維","何怡安","林承宇","陳雅晴",
    "張俊豪","黃佳穎","蔡佩蓉","楊哲宇","劉雅婷","鄭承翰","吳柏廷","謝郁婷","洪雅筑","許哲豪",
    "郭佳蓉","曾俊宇","邱柏翰","蘇雅玲","高承恩","何佩珊","林哲維","陳怡婷","張雅晴","黃柏霖",
    "蔡俊廷","楊郁涵","劉哲安","鄭佳穎","吳佩君","謝承宇","洪柏豪","許雅婷","郭哲維","曾佳蓉",
    "邱俊宇","蘇佩珊","高哲豪","何雅晴","林柏廷","陳承澤","張佳穎","黃郁婷","蔡哲宇","楊雅筑",
    "劉柏霖","鄭哲維","吳佳婷","謝承恩","洪哲豪","許佩蓉","郭俊廷","曾雅玲","邱哲安","蘇郁涵",
    "高俊宇","何佳穎","林佩君","陳柏豪","張承翰","黃雅婷","蔡哲維","楊佳蓉","劉承宇","鄭柏廷"
]
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:123456@localhost:5432/mimic"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"[FLASK ERROR] {type(e).__name__}: {e}")
    try:
        db.session.rollback()
    except Exception:
        pass

    import traceback
    traceback.print_exc()
    return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# Database Models
# ==========================================
class Patient(db.Model):
    __tablename__ = 'patients'
    __table_args__ = {'schema': 'hosp'}
    subject_id = db.Column(db.Integer, primary_key=True)
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
    __table_args__ = {'schema': 'reference'}
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

DRUG_JSON_PATH = os.path.join(os.path.dirname(__file__), 'drug_adverse.json')

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


@app.route('/')
def home():
    return jsonify({
        "status": "success",
        "message": "ADR PRO Flask API is running",
        "api": ["/api/patients", "/api/login", "/api/search", "/api/stats"]
    })

# ==========================================
# API Routes
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        print("LOGIN TRY:", username, password)
        print("DB URL:", app.config["SQLALCHEMY_DATABASE_URI"])

        if not username or not password:
            return jsonify({"status": "error", "message": "請輸入帳號和密碼"}), 400

        user = DoctorAccount.query.filter(
         DoctorAccount.username == username,
         DoctorAccount.password == password
        ).first()

        all_users = DoctorAccount.query.all()
        print("ALL USERS:", [(u.username, u.password) for u in all_users])
        if user is None:
            return jsonify({"status": "error", "message": "帳號或密碼錯誤"}), 401

        return jsonify({"status": "success", "user": {"name": user.full_name, "role": user.role}})
    except Exception as e:
        return jsonify({"status": "error", "message": f"資料庫錯誤: {str(e)}"}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """
    患者住院紀錄 API
    資料來源：analysis.demo_top200
    回傳格式維持前端原本使用的 patients -> admissions -> clinicalData
    """
    try:
        sql = text("""
            SELECT
                d.subject_id,
                d.hadm_id,
                p.gender,
                p.anchor_age,
                a.admittime,
                a.dischtime,
                d.charttime,
                d.label,
                d.analyte,
                d.impact_analyte,
                d.valuenum,
                d.status,
                d.mimic_drug,
                d.drug_time,
                d.reference_drug_name,
                d.impact_direction,
                d.hours_after_drug
            FROM analysis.demo_top200_v2 d
            LEFT JOIN hosp.patients p
              ON d.subject_id = p.subject_id
            LEFT JOIN hosp.admissions a
              ON d.subject_id = a.subject_id
             AND d.hadm_id = a.hadm_id
            ORDER BY d.subject_id, d.hadm_id, d.charttime, d.drug_time
        """)

        rows = db.session.execute(sql).mappings().all()
        patient_map = {}

        for r in rows:
            subject_id = r["subject_id"]
            hadm_id = r["hadm_id"]
            adm_key = str(hadm_id)

            if subject_id not in patient_map:
                patient_map[subject_id] = {
                    "id": f"P{subject_id}",
                    "subject_id": subject_id,
                    "name": fake_names[len(patient_map) % len(fake_names)],
                    "info": f"({r['gender'] or '-'} / {r['anchor_age'] or '-'})",
                    "na": "-",
                    "k": "-",
                    "room": "-",
                    "status": "ADR 監測中",
                    "admissions": {},
                    "_latestLabs": {},
                }

            if adm_key not in patient_map[subject_id]["admissions"]:
                admittime = shift_demo_time(r["admittime"])
                dischtime = shift_demo_time(r["dischtime"])
                date_text = (
                    f"{admittime.date() if admittime else '-'} - "
                    f"{dischtime.date() if dischtime else '-'}"
                )

                patient_map[subject_id]["admissions"][adm_key] = {
                    "id": hadm_id,
                    "date": date_text,
                    "admitRaw": admittime.isoformat() if admittime else None,
                    "dischargeRaw": dischtime.isoformat() if dischtime else None,
                    "clinicalData": {
                        "trends": [],
                        "gantt": [],
                        "logs": [],
                        "_drugMap": {}
                    }
                }

            clinical = patient_map[subject_id]["admissions"][adm_key]["clinicalData"]

            # 檢驗趨勢資料
            charttime = shift_demo_time(r["charttime"])
            date_label = charttime.strftime("%Y-%m-%d %H:%M") if charttime else "-"

            trend = next(
                (item for item in clinical["trends"] if item["date"] == date_label),
                None
            )
            if trend is None:
                trend = {
                    "date": date_label,
                    "rawTime": charttime.isoformat() if charttime else None
                }
                clinical["trends"].append(trend)

            analyte = r["analyte"]
            valuenum = float(r["valuenum"]) if r["valuenum"] is not None else None

            if analyte == "Na":
                trend["na"] = valuenum
                trend["naStatus"] = r["status"]

            elif analyte == "K":
                trend["k"] = valuenum
                trend["kStatus"] = r["status"]

            if analyte in ["Na", "K"] and charttime:
                latest = patient_map[subject_id]["_latestLabs"].get(analyte)

                if latest is None or charttime > latest["time"]:
                    patient_map[subject_id]["_latestLabs"][analyte] = {
                        "time": charttime,
                        "value": r["valuenum"],
                        "status": r["status"]
                    }

            # 藥物資料
            drug_name = r["mimic_drug"]
            if drug_name:
                drug_time = shift_demo_time(r["drug_time"])
                drug_date = drug_time.strftime("%Y-%m-%d %H:%M") if drug_time else "-"

                impact = ""

                direction = str(r["impact_direction"] or "").strip().lower()
                mapped_analyte = str(r["impact_analyte"] or "").strip()

                if direction in ["e", "up", "increase", "increased", "higher", "上升"]:
                    impact = f"{mapped_analyte}↑"

                elif direction in ["d", "down", "decrease", "decreased", "lower", "下降"]:
                    impact = f"{mapped_analyte}↓"

                drug_map = clinical["_drugMap"]

                drug_key = str(drug_name).strip().lower()
                drug_raw = drug_time.isoformat() if drug_time else None

                if drug_key not in drug_map:
                    drug_map[drug_key] = {
                        "name": drug_name,
                        "type": "Electrolyte",
                        "start": drug_date,
                        "end": drug_date,
                        "startRaw": drug_raw,
                        "endRaw": drug_raw,
                        "dose": [],
                        "status": "ACTIVE",
                        "impactList": [impact] if impact else [],
                        "impact": impact,
                        "startDate": drug_date,
                        "endDate": drug_date,
                        "startIdx": 0,
                        "endIdx": 1,
                        "color": "#F97316" if impact.endswith("↑") else "#6366F1",
                        "level": "",
                        "administrations": [{
                            "time": drug_date,
                            "rawTime": drug_raw,
                            "drug": drug_name,
                            "mappedDrug": r["reference_drug_name"] or "Mapped Drug",
                            "impact": impact,
                            "hoursAfterDrug": r["hours_after_drug"]
                        }]
                    }
                else:
                    old = drug_map[drug_key]
                    admin_record = {
                        "time": drug_date,
                        "rawTime": drug_raw,
                        "drug": drug_name,
                        "mappedDrug": r["reference_drug_name"] or "Mapped Drug",
                        "impact": impact,
                        "hoursAfterDrug": r["hours_after_drug"]
                    }

                    if not any(a.get("rawTime") == drug_raw for a in old["administrations"]):
                        old["administrations"].append(admin_record)

                    if impact and impact not in old["impactList"]:
                        old["impactList"].append(impact)
                        old["impact"] = " / ".join(old["impactList"])

                    if drug_time and old["startRaw"]:
                        if drug_time.isoformat() < old["startRaw"]:
                            old["startRaw"] = drug_time.isoformat()
                            old["start"] = drug_date
                            old["startDate"] = drug_date

                        if drug_time.isoformat() > old["endRaw"]:
                            old["endRaw"] = drug_time.isoformat()
                            old["end"] = drug_date
                            old["endDate"] = drug_date

        result = []

        for patient in patient_map.values():
            admissions_list = []
            latest_labs = patient.get("_latestLabs", {})

            na_latest = latest_labs.get("Na")
            k_latest = latest_labs.get("K")

            patient["na"] = str(na_latest["value"]) if na_latest else "-"
            patient["k"] = str(k_latest["value"]) if k_latest else "-"

            abnormal_status = []
            if na_latest:
                if na_latest["status"] == "LOW":
                    abnormal_status.append("鈉偏低")
                elif na_latest["status"] == "HIGH":
                    abnormal_status.append("鈉偏高")

            if k_latest:
                if k_latest["status"] == "LOW":
                    abnormal_status.append("鉀偏低")
                elif k_latest["status"] == "HIGH":
                    abnormal_status.append("鉀偏高")

            patient["status"] = " / ".join(abnormal_status) if abnormal_status else "-"

            patient.pop("_latestLabs", None)

            for adm in patient["admissions"].values():
                clinical = adm["clinicalData"]

                drug_list = list(clinical.get("_drugMap", {}).values())

                clinical["logs"] = drug_list
                clinical["gantt"] = drug_list
                clinical.pop("_drugMap", None)

                admissions_list.append(adm)

            patient["admissions"] = admissions_list
            result.append(patient)

        return jsonify({"status": "success", "data": result})
    except Exception as e:
        import traceback
        traceback.print_exc()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/search', methods=['POST'])
def search_drugs():
    req = request.get_json(silent=True) or {}

    keyword = (req.get('keyword') or '').strip().lower()
    categories = req.get('categories') or []
    filter_type = req.get('filter') or ''

    sql = """
        SELECT
            drug_code AS id,
            drug_name AS name,
            adverse_reaction,
            exception_handling
        FROM reference.drug_adverse_info
        WHERE 1=1
    """

    params = {}

    if keyword:
        sql += """
            AND (
                LOWER(drug_name) LIKE :kw
                OR LOWER(COALESCE(drug_code, '')) LIKE :kw
            )
        """
        params["kw"] = f"%{keyword}%"

    if filter_type == "reactions":
        sql += """
            AND adverse_reaction IS NOT NULL
            AND TRIM(adverse_reaction) <> ''
            AND LOWER(adverse_reaction) <> 'nan'
        """

    sql += " ORDER BY drug_name"

    rows = db.session.execute(text(sql), params).mappings().all()
    drugs = [dict(r) for r in rows]

    if categories:
        drugs = [
            d for d in drugs
            if all(
                c.lower() in str(d.get("adverse_reaction") or "").lower()
                for c in categories
            )
        ]

    return jsonify({"status": "success", "data": drugs})


@app.route('/api/electrolyte_impact', methods=['GET'])
def get_electrolyte_impact():
    from sqlalchemy import text

    analyte = request.args.get('analyte', '').strip()
    keyword = request.args.get('keyword', '').strip()
    direction = request.args.get('direction', '').strip().upper()

    sql = """
        WITH normalized AS (
            SELECT
                TRIM(drug_name) AS drug_name,

                CASE
                    WHEN UPPER(TRIM(analyte)) IN ('NA', 'SODIUM') THEN 'Na'
                    WHEN UPPER(TRIM(analyte)) IN ('K', 'POTASSIUM') THEN 'K'
                    ELSE UPPER(TRIM(analyte))
                END AS analyte,

                CASE
                    WHEN UPPER(TRIM(impact_direction)) IN ('E', 'UP', 'INCREASE', 'INCREASED', 'HIGHER', '上升', '升高') THEN 'E'
                    WHEN UPPER(TRIM(impact_direction)) IN ('D', 'DOWN', 'DECREASE', 'DECREASED', 'LOWER', '下降', '降低') THEN 'D'
                    ELSE UPPER(TRIM(impact_direction))
                END AS impact_direction,

                COALESCE(record_type::text, '') AS record_type,
                COALESCE(remarks::text, '') AS remarks,
                COALESCE(is_active::text, 'true') AS is_active
            FROM reference.electrolyte_impact
            WHERE drug_name IS NOT NULL
    """

    params = {}

    if keyword:
        sql += " AND TRIM(drug_name) ILIKE :kw"
        params["kw"] = f"%{keyword}%"

    sql += """
        )
        SELECT
            MIN(record_type) AS record_type,
            drug_name,
            analyte,
            impact_direction,
            STRING_AGG(DISTINCT NULLIF(remarks, ''), '；') AS remarks,
            TRUE AS is_active
        FROM normalized
        WHERE 1=1
    """

    if analyte:
        norm_analyte = "Na" if analyte.upper() in ["NA", "SODIUM"] else "K" if analyte.upper() in ["K", "POTASSIUM"] else analyte.upper()
        sql += " AND analyte = :analyte"
        params["analyte"] = norm_analyte

    if direction:
        norm_direction = "E" if direction in ["E", "UP", "INCREASE", "INCREASED", "HIGHER", "上升", "升高"] else "D" if direction in ["D", "DOWN", "DECREASE", "DECREASED", "LOWER", "下降", "降低"] else direction
        sql += " AND impact_direction = :direction"
        params["direction"] = norm_direction

    sql += """
        GROUP BY drug_name, analyte, impact_direction
        ORDER BY drug_name, analyte, impact_direction
    """

    with db.engine.connect() as conn:
        result = conn.execute(text(sql), params)
        rows = [dict(r._mapping) for r in result]

    return jsonify({
        "status": "success",
        "data": rows,
        "total": len(rows)
    })


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
        INSERT INTO reference.electrolyte_impact (drug_name, analyte, impact_direction, remarks, is_active, record_type)
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
        UPDATE reference.electrolyte_impact SET {set_clause}
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
    sql = text("DELETE FROM reference.electrolyte_impact WHERE drug_name = :drug_name AND analyte = :analyte AND impact_direction = :impact_direction")
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

@app.route('/api/drugs/<path:old_drug_name>', methods=['PUT'])
def update_drug_adverse_info(old_drug_name):

    data = request.get_json(silent=True) or {}

    drug_name = (data.get('drug_name') or '').strip()
    drug_code = (data.get('drug_code') or '').strip()

    adverse_reaction = data.get('adverse_reaction') or ''
    exception_handling = data.get('exception_handling') or ''

    if not drug_name:
        return jsonify({
            "status": "error",
            "message": "藥物名稱不可空白"
        }), 400

    sql = text("""

        UPDATE reference.drug_adverse_info

        SET
            drug_name = :drug_name,
            drug_code = :drug_code,
            adverse_reaction = :adverse_reaction,
            exception_handling = :exception_handling,
            updated_at = CURRENT_TIMESTAMP

        WHERE drug_name = :old_drug_name

        RETURNING
            drug_code AS id,
            drug_name AS name,
            adverse_reaction,
            exception_handling

    """)

    row = db.session.execute(sql, {

        "old_drug_name": old_drug_name,

        "drug_name": drug_name,

        "drug_code": drug_code,

        "adverse_reaction": adverse_reaction,

        "exception_handling": exception_handling

    }).mappings().first()

    db.session.commit()

    if not row:
        return jsonify({
            "status": "error",
            "message": "找不到該藥物"
        }), 404

    return jsonify({
        "status": "success",
        "data": dict(row)
    })

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
            return jsonify({"status": "success", "message": "建議已成功提交", "data": new_row.to_dict()})
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
                CREATE TABLE IF NOT EXISTS reference.electrolyte_impact (
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